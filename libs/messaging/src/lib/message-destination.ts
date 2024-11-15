import { Attachment, Issue, User } from '@renwu/core';
import { filterFalsy } from '@renwu/utils';
import { BehaviorSubject, Observable, Subscription, forkJoin, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
  DestinationInfo,
  DestinationType,
  GetMessagesResult,
  IssueDestinationInfo,
  Message,
  MessageEventType,
  UserDestinationInfo,
} from './data/messages.model';
import { MessageItem } from './message-item';
import { RwMessageService } from './message.service';

export interface MessageDestinationOptions {
  root?: MessageDestination;
  reversed?: boolean;
}

export interface MessageDestinationInfo extends DestinationInfo {
  message?: MessageItem;
}

export class CommonMessageDestination implements IMessageDestination {
  readonly type: DestinationType;
  info:
    | IssueDestinationInfo
    | UserDestinationInfo
    | DestinationInfo
    | MessageDestinationInfo;
  isExternal = new BehaviorSubject<boolean>(false);
  rootDestination: MessageDestination;
  // currentSubDestination = new BehaviorSubject<MessageDestination>(null);
  subDestinations = new BehaviorSubject<MessageDestination[]>([]);
  subDestinationsMap = new Map<string, MessageDestination>();
  messages = new BehaviorSubject<MessageItem[]>([]);
  pinnedMessages = new BehaviorSubject<MessageItem[]>([]);
  editMessage = new BehaviorSubject<MessageItem>(null);
  messagesMap = new Map<string, MessageItem>();
  pinnedMessagesMap = new Map<string, MessageItem>();
  leftBefore = new BehaviorSubject<number>(0);
  leftAfter = new BehaviorSubject<number>(0);
  unreadCount = new BehaviorSubject<number>(0);
  markCount = new BehaviorSubject<number>(0);
  pulseCount = new BehaviorSubject<number>(0);
  lastTime = new BehaviorSubject<Date>(new Date(0));
  item = new BehaviorSubject<unknown>(null);
  subMembers = new BehaviorSubject<string[]>([]);
  selectedMessage = new BehaviorSubject<{ id: string }>(null);
  service: RwMessageService;

  latestAction: 'next' | 'prev' | 'new' | 'init' | 'show';

  reversed: boolean;

  id: string;

  eventSubscription: Subscription;

  scrollTop: number;
  firstInit: boolean;

  private lastMessageId: string;
  private firstMessageId: string;

  constructor(
    service: RwMessageService,
    info:
      | IssueDestinationInfo
      | UserDestinationInfo
      | MessageDestinationInfo
      | DestinationInfo,
    options: MessageDestinationOptions = {},
  ) {
    // this.currentSubDestination.next(this as MessageDestination);
    this.latestAction = 'init';

    this.service = service;

    this.updateInfo(info);
    if (!info.destination) {
      return;
    }
    this.id = info.destination.id;
    this.type = info.destination.type;

    if (options) {
      this.rootDestination = options.root || undefined;
      this.reversed = options.reversed || false;
    }

    this.firstInit = true;

    switch (info.destination.type) {
      case DestinationType.MESSAGE:
        try {
          this.info.name = (
            info as MessageDestinationInfo
          ).message.text.getValue();
        } catch (e) {
          this.info.name = '';
        }
        break;
    }

    // this.setSubDestination(this as MessageDestination);
  }
  show(pageSize: number) {
    this.latestAction = 'show';

    this.service
      .loadPinnedMessages(this.info.destination, false)
      .subscribe((data) => {
        if (data.items) {
          data.items.forEach((i) => {
            this.pinnedMessagesMap.set(
              i.id,
              new MessageItem(i, this as MessageDestination),
            );
          });
          this.messagesMapToArray();
        }
      });

    if (this.firstInit) {
      this.service
        .loadMessages(undefined, this.info.destination, pageSize, 0, false)
        .subscribe((data) => {
          this.leftBefore.next(data.leftBefore);
          this.leftAfter.next(data.leftAfter);
          data.items.forEach((i) => this.upsertMessage(i));
          this.messagesMapToArray();
        });
      this.firstInit = false;
    } else {
      this.loadNext(pageSize).subscribe();
    }

    this.updateSubdestinations();

    this.service.subscribeDestination(this.info.destination);
    if (this.rootDestination) {
      this.service.subscribeDestination(this.rootDestination.info.destination);
    }

    this.eventSubscription = this.service.events.subscribe((value) => {
      if (value.eventType === MessageEventType.ADD) {
        if (value.message.destination.id === this.id) {
          this.upsertMessage(value.message);
          this.messagesMapToArray();
        }
      }
      if (value.eventType === MessageEventType.CHAT_EDIT) {
        if (value.chat.destination.id === this.id) {
          this.updateSubdestinations();
        }
      }
      if (value.eventType === MessageEventType.EDIT) {
        if (this.messagesMap.has(value.message.id)) {
          this.upsertMessage(value.message).updateText(value.message.message);
        }
      }
      if (value.eventType === MessageEventType.READ) {
        if (value.message.destination.id === this.id) {
          this.upsertMessage(value.message);
        }
      }
      if (value.eventType === MessageEventType.DELETE) {
        this.remove(this.upsertMessage(value.message));
      }
    });
  }
  postFile(file: Attachment, text: string) {
    this.service
      .postFileMessage(this.info.destination, file.url, file.file_name, text)
      .pipe(
        switchMap(() => {
          if (this.id && this.info.destination.type === DestinationType.ISSUE) {
            return this.service.addAttachment(this.id, file);
          }
          return of(null);
        }),
      )
      .subscribe();
  }
  messagesMapToArray(): void {
    let messagesArray = Array.from(this.messagesMap.values()).sort(
      (a, b) => a.createTime.getTime() - b.createTime.getTime(),
    );

    this.lastMessageId =
      messagesArray.length > 0
        ? messagesArray[messagesArray.length - 1].id
        : undefined;
    this.firstMessageId =
      messagesArray.length > 0 ? messagesArray[0].id : undefined;

    if (this.reversed) {
      messagesArray = messagesArray.reverse();
    }

    messagesArray.forEach((message, index) => {
      index > 0
        ? message.updatePrev(messagesArray[index - 1])
        : message.updatePrev(undefined);
      index < messagesArray.length
        ? message.updateNext(messagesArray[index + 1])
        : message.updateNext(undefined);
    });

    let pinnedMessagesArray = Array.from(this.pinnedMessagesMap.values()).sort(
      (a, b) => a.createTime.getTime() - b.createTime.getTime(),
    );

    if (this.reversed) {
      pinnedMessagesArray = pinnedMessagesArray.reverse();
    }

    pinnedMessagesArray.forEach((message, index) => {
      index > 1
        ? message.updatePrev(pinnedMessagesArray[index - 1])
        : message.updatePrev(undefined);
    });

    this.pinnedMessages.next(pinnedMessagesArray);
    this.messages.next(messagesArray);
  }
  hide(): void {
    this.service.unsubscribeDestination(this.info.destination);
    if (this.rootDestination) {
      this.service.unsubscribeDestination(
        this.rootDestination.info.destination,
      );
    }
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }
  loadNext(pageSize: number) {
    return this.service
      .loadMessages(
        this.lastMessageId,
        this.info.destination,
        0,
        pageSize,
        false,
      )
      .pipe(
        tap((data) => {
          if (data.items[0]) {
            const messageFirst = this.upsertMessage(data.items[0]);
            messageFirst.showAvatar = true;
            messageFirst.updateFlags();
          }
          this.leftAfter.next(data.leftAfter);
          data.items.forEach((i) => this.upsertMessage(i));
          this.latestAction = 'next';
          this.messagesMapToArray();
        }),
      );
  }
  loadThread(message: MessageItem) {
    message.children = [];
    message.updated.next();
    return this.service
      .loadMessages(
        undefined,
        { id: message.id, type: DestinationType.MESSAGE },
        999999,
        0,
        false,
      )
      .pipe(
        tap((messages) => {
          const sub = this.service.createMessageSubDestination(message);
          message.children = messages.items.map(
            (message) => new MessageItem(message, sub),
          );
          message.updated.next();
        }),
      );
  }
  loadPrev(pageSize: number) {
    return this.service
      .loadMessages(
        this.firstMessageId,
        this.info.destination,
        pageSize,
        0,
        false,
      )
      .pipe(
        tap((data) => {
          if (data.items[data.items.length - 1]) {
            const messageLast = this.upsertMessage(
              data.items[data.items.length - 1],
            );
            messageLast.showAvatar = true;
            messageLast.updateFlags();
          }
          this.leftBefore.next(data.leftBefore);
          this.latestAction = 'prev';
          data.items.forEach((i) => this.upsertMessage(i));
          this.messagesMapToArray();
        }),
      );
  }
  edit(message: MessageItem): void {
    this.editMessage.next(message);
  }
  editLast(): void {
    const messagesArray = this.messages.getValue();
    const lastMessageIndex = messagesArray.reverse().findIndex((message) => {
      return message.author.id === this.service.userService.getId();
    });
    messagesArray.reverse();
    if (lastMessageIndex > -1) {
      this.editMessage.next(
        messagesArray[messagesArray.length - 1 - lastMessageIndex],
      );
    }
  }
  delete(message: MessageItem): void {
    this.service.deleteMessage(message).subscribe(() => {
      this.remove(message);
    });
  }
  remove(message: MessageItem): void {
    this.messagesMap.delete(message.id);
    this.messagesMapToArray();
  }
  update(message: MessageItem, text: string): void {
    message.updateText(text);
    message.setSending();
    this.service
      .updateMessage(message.id, message.text.getValue(), message.isExternal)
      .subscribe(() => {
        message.setSended();
        this.editMessage.next(undefined);
      });
  }
  send(text: string, external: boolean): void {
    if (text === '') {
      return;
    }
    const message = this.service.prepareNewMessage(
      this.info.destination,
      text,
      external,
    );
    const messageItem = this.upsertMessage(message);
    messageItem.setSending();
    this.messagesMapToArray();

    this.service.postMessage(this.info.destination, text, external).subscribe(
      (result) => {
        this.latestAction = 'new';
        this.messagesMap.delete(messageItem.id);
        messageItem.updateId(result.id);
        this.messagesMap.set(result.id, messageItem);
        messageItem.setSended();
        this.messagesMapToArray();
      },
      () => {
        messageItem.setSendError();
      },
    );
  }
  // openSubDestination(destination: MessageDestination) {
  //   // this.currentSubDestination.next(destination);
  //   this.setSubDestination(destination);
  // }
  // closeSubDestination(destination: MessageDestination) {
  //   this.service.mapDestination.delete(destination.id);
  //   this.subDestinationsMap.delete(destination.id);
  //   this.subDestinations.next(Array.from(this.subDestinationsMap.values()));
  //   // this.currentSubDestination.next(this as MessageDestination);
  // }
  // openSubDestinationByMessage(message: MessageItem, visible: boolean) {
  //   const messageItem = this.upsertMessage(message.message);
  //   return this.openSubDestinationByInfo(
  //     {
  //       name: message.text.getValue(),
  //       destination: {
  //         id: message.id,
  //         type: DestinationType.MESSAGE,
  //       },
  //       message: messageItem,
  //     },
  //     visible
  //   );
  // }
  // openSubDestinationByInfo(info: MessageDestinationInfo, visible: boolean) {
  //   const sub = this.service.getOrCreateDestination(info, {
  //     root: this as MessageDestination,
  //   });
  //   if (visible) {
  //     this.setSubDestination(sub);
  //     // this.currentSubDestination.next(sub);
  //   }
  //   return sub;
  // }
  setSubDestination(destination: MessageDestination) {
    this.service.mapDestination.set(destination.id, destination);
    this.subDestinationsMap.set(destination.id, destination);
    this.subDestinations.next(Array.from(this.subDestinationsMap.values()));
  }
  setScroll(value: number) {
    this.scrollTop = value;
  }
  updateInfo(info?: DestinationInfo) {
    this.info = Object.assign(this.info || {}, info || {});

    this.info.unreadCount = info?.unreadCount || 0;
    this.info.pulseCount = info?.pulseCount || 0;
    this.info.lastTime = info?.lastTime
      ? new Date(info?.lastTime).toISOString()
      : new Date(0).toISOString();

    this.unreadCount.next(this.info.unreadCount);
    this.pulseCount.next(this.info.pulseCount);
    this.lastTime.next(new Date(this.info.lastTime));
    try {
      this.subMembers.next(
        (this.info as MessageDestinationInfo).message.subMembers || [],
      );
    } catch {
      this.subMembers.next([]);
    }

    if (
      this.info.destination.type === DestinationType.ISSUE &&
      this.info.destination.id &&
      this.info.destination.id !== 'new'
    ) {
      this.service.dataService
        .getIssuesByIDBackgroundBuffered(this.info.destination.id)
        .pipe(filterFalsy())
        .subscribe((issue) => {
          (this.info as IssueDestinationInfo).issue = issue;
          this.item.next(issue);
          this.isExternal.next(issue.is_external);
        });
    }

    if (this.info.destination.type === DestinationType.USER) {
      const user = this.service.userService.getUserById(
        this.info.destination.id,
      );
      if (!user) {
        return;
      }
      (this.info as UserDestinationInfo).user = user;
      this.item.next(user);
      this.isExternal.next(user.type === 'external');
    }
  }
  updateSubdestinations(): void {
    this.service
      .loadSubThreads(this.info.destination)
      .pipe(
        switchMap((destinationsInfo) => {
          const getMessages = destinationsInfo.map((destinationInfo) => {
            if (destinationInfo.destination.id !== this.id) {
              return this.service
                .loadMessage(destinationInfo.destination.id)
                .pipe(
                  tap((message) => {
                    (destinationInfo as MessageDestinationInfo).message =
                      this.upsertMessage(message);
                    const sub = this.service.getOrCreateDestination(
                      destinationInfo,
                      { root: this as MessageDestination },
                    );
                    this.setSubDestination(sub);

                    const messageItem = this.upsertMessage(message);
                    messageItem.subDestination = sub;
                    messageItem.updateFlags();
                  }),
                );
            }
            return of();
          });
          return forkJoin(getMessages);
        }),
      )
      .subscribe();
  }
  upsertMessage(message: Message): MessageItem {
    const messageItem =
      this.messagesMap.get(message.id) ||
      new MessageItem(message, this as MessageDestination);
    messageItem.message = Object.assign(messageItem.message, message);
    messageItem.updateFlags();
    this.messagesMap.set(messageItem.id, messageItem);
    return messageItem;
  }

  markreadAllUnread(): void {
    this.service.markreadAllUnreadInDestination(this as MessageDestination);
  }
  markreadAllPulse(): void {
    this.service.markreadAllPulseInDestination(this as MessageDestination);
  }
}

export class FavMessageDestination
  extends CommonMessageDestination
  implements IFavMessageDestination
{
  // https://github.com/microsoft/TypeScript/issues/10570
  override type: DestinationType.FAV = DestinationType.FAV;
  override info: DestinationInfo;

  constructor(service: RwMessageService) {
    super(service, {
      name: 'Favorites messages',
      destination: { id: 'fav', type: DestinationType.FAV },
    });
  }
  override show(): void {
    this.updateFavs();
  }
  updateFavs(): void {
    this.service.loadFavMessage().subscribe((messages) => {
      if (messages) {
        const oldKeys = new Set(Array.from(this.messagesMap.keys()));

        messages.forEach((i) => {
          const message = this.upsertMessage(i);
          oldKeys.delete(message.id);
        });

        for (const k of oldKeys) {
          this.messagesMap.delete(k);
        }
        this.messagesMapToArray();
      }
    });
  }
  override postFile() {
    return;
  }
  override hide() {
    return;
  }
  override loadNext() {
    return of({ items: [], leftBefore: 0, leftAfter: 0 });
  }
  override loadThread() {
    return of({ items: [], leftBefore: 0, leftAfter: 0 });
  }
  override loadPrev() {
    return of({ items: [], leftBefore: 0, leftAfter: 0 });
  }
  override edit() {
    return;
  }
  override editLast() {
    return;
  }
  override delete() {
    return;
  }
  override remove() {
    return;
  }
  override update() {
    return;
  }

  override send() {
    return;
  }
  // override openSubDestination() {}
  // override closeSubDestination() {}
  // override openSubDestinationByMessage(): MessageDestination {
  //   return null;
  // }
  // override openSubDestinationByInfo(): MessageDestination {
  //   return null;
  // }
  override setSubDestination() {
    return;
  }
  override setScroll() {
    return;
  }
  override updateSubdestinations() {
    return;
  }
  override updateInfo(info: DestinationInfo) {
    this.info = Object.assign(this.info || {}, info || {});
  }
}

export interface IMessageDestination {
  readonly type: DestinationType;
  info:
    | IssueDestinationInfo
    | UserDestinationInfo
    | DestinationInfo
    | MessageDestinationInfo;
  isExternal: BehaviorSubject<boolean>;
  rootDestination: MessageDestination;
  // currentSubDestination: BehaviorSubject<MessageDestination>;
  subDestinations: BehaviorSubject<MessageDestination[]>;
  subDestinationsMap: Map<string, MessageDestination>;
  messages: BehaviorSubject<MessageItem[]>;
  pinnedMessages: BehaviorSubject<MessageItem[]>;
  editMessage: BehaviorSubject<MessageItem>;
  messagesMap: Map<string, MessageItem>;
  pinnedMessagesMap: Map<string, MessageItem>;
  leftBefore: BehaviorSubject<number>;
  leftAfter: BehaviorSubject<number>;
  unreadCount: BehaviorSubject<number>;
  markCount: BehaviorSubject<number>;
  pulseCount: BehaviorSubject<number>;
  lastTime: BehaviorSubject<Date>;
  item: BehaviorSubject<unknown>;
  subMembers: BehaviorSubject<string[]>;
  service: RwMessageService;
  selectedMessage: BehaviorSubject<{ id: string }>;

  latestAction: 'next' | 'prev' | 'new' | 'init' | 'show';

  reversed: boolean;

  id: string;

  eventSubscription: Subscription;

  scrollTop: number;
  firstInit: boolean;

  show(pageSize: number): void;
  postFile(file: Attachment, text: string): void;
  messagesMapToArray(): void;
  hide(): void;
  loadNext(pageSize: number): Observable<GetMessagesResult>;
  loadThread(message: MessageItem): Observable<GetMessagesResult>;
  loadPrev(pageSize: number): Observable<GetMessagesResult>;
  edit(message: MessageItem): void;
  editLast(): void;
  delete(message: MessageItem): void;
  remove(message: MessageItem): void;
  update(message: MessageItem, text: string): void;
  send(text: string, external: boolean): void;
  // openSubDestination(destination: IMessageDestination): void;
  // closeSubDestination(destination: IMessageDestination): void;
  // openSubDestinationByMessage(
  //   message: MessageItem,
  //   visible: boolean
  // ): IMessageDestination;
  // openSubDestinationByInfo(
  //   info: MessageDestinationInfo,
  //   visible: boolean
  // ): IMessageDestination;
  setSubDestination(destination: IMessageDestination): void;
  setScroll(value: number): void;
  updateInfo(info?: DestinationInfo): void;
  updateSubdestinations(): void;
  upsertMessage(message: Message): MessageItem;

  markreadAllUnread(): void;
  markreadAllPulse(): void;
}

export interface TaskMessageDestination extends IMessageDestination {
  type: DestinationType.ISSUE;
  info: IssueDestinationInfo;
  item: BehaviorSubject<Issue>;
}

export interface UserMessageDestination extends IMessageDestination {
  type: DestinationType.USER;
  info: UserDestinationInfo;
  item: BehaviorSubject<User>;
}

export interface MessageMessageDestination extends IMessageDestination {
  type: DestinationType.MESSAGE;
  info: MessageDestinationInfo;
}

export interface OtherMessageDestination extends IMessageDestination {
  type:
    | DestinationType.CONTAINER
    | DestinationType.CHANNEL
    | DestinationType.UNKNOWN_DESTINATION_TYPE;
  info: DestinationInfo;
}

export interface IFavMessageDestination extends IMessageDestination {
  type: DestinationType.FAV;
  info: DestinationInfo;
}

export type MessageDestination =
  | TaskMessageDestination
  | UserMessageDestination
  | MessageMessageDestination
  | OtherMessageDestination
  | IFavMessageDestination;
