import { inject, Inject, Injectable } from '@angular/core';
import { RwToastService } from '@renwu/components';
import {
  Attachment,
  RW_CORE_SETTINGS,
  RwCoreSettings,
  RwDataService,
  RwUserService,
  User,
} from '@renwu/core';
import { JSONUtils, RxWebsocketSubject, testImageExtension } from '@renwu/utils';

import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
  buffer,
  catchError,
  debounceTime,
  map,
  switchMap,
} from 'rxjs/operators';

import { TranslocoService } from '@ngneat/transloco';
import { formatISO } from 'date-fns';
import {
  Destination,
  DestinationInfo,
  DestinationType,
  Message,
  MessageEvent,
  MessageEventType,
  MessageType,
  MessagingSendCommand,
  UserDestinationInfo,
} from './data/messages.model';
import { RwMessagingDataService } from './data/messaging-data.service';
import {
  CommonMessageDestination,
  FavMessageDestination,
  IMessageDestination,
  MessageDestination,
  MessageDestinationInfo,
  MessageDestinationOptions,
  TaskMessageDestination,
  UserMessageDestination,
} from './message-destination';
import { MessageItem } from './message-item';

@Injectable({
  providedIn: 'root',
})
export class RwMessageService {
  transloco = inject(TranslocoService);

  token = '';
  tenant = '';
  connected = new BehaviorSubject<boolean>(false);
  subject: RxWebsocketSubject<MessagingSendCommand, MessageEvent>;
  unreadCount: BehaviorSubject<number>;
  pulseCount: BehaviorSubject<number>;
  mapDestination = new Map<string, MessageDestination>();
  mention: boolean;
  // selectedTab: string;
  subscribeDestinationMap: Map<string, Destination>;

  userDestinations: BehaviorSubject<UserMessageDestination[]>;
  taskDestinations: BehaviorSubject<TaskMessageDestination[]>;
  favDestination: FavMessageDestination;

  TEMP_MESSAGE_KEY = 'renwu_temp_messages';
  temp_messages: { [key: string]: string };

  displayDisconnected: boolean;
  arrayMessagesForMarkread: Message[];
  timeoutMarkread: number;

  // selectedDestination: BehaviorSubject<MessageDestination>;
  // selectedMessage: BehaviorSubject<{
  //   id: string;
  // }>;

  events: Subject<MessageEvent>;
  markreadBuffer: Subject<MessageItem>;

  constructor(
    public userService: RwUserService,
    public messagingDataService: RwMessagingDataService,
    public dataService: RwDataService,
    public toastService: RwToastService,
    @Inject(RW_CORE_SETTINGS) private settings: RwCoreSettings,
  ) {
    this.events = new Subject();
    this.unreadCount = new BehaviorSubject(0);
    this.pulseCount = new BehaviorSubject(0);
    this.favDestination = new FavMessageDestination(this);
    this.mapDestination.set(
      this.favDestination.id,
      this.favDestination as MessageDestination,
    );

    this.userDestinations = new BehaviorSubject<UserMessageDestination[]>([]);
    this.taskDestinations = new BehaviorSubject<TaskMessageDestination[]>([]);
    // this.selectedMessage = new BehaviorSubject<{ id: string }>(null);
    // this.selectedDestination = new BehaviorSubject<MessageDestination>(null);

    this.subscribeDestinationMap = new Map();

    this.markreadBuffer = new Subject();

    this.markreadBuffer
      .pipe(
        buffer(this.markreadBuffer.pipe(debounceTime(100))),
        switchMap((result) => {
          const ids = result.map((message) => message.id);
          return this.messagingDataService.markreadMessages(ids);
        }),
      )
      .subscribe();
  }
  create(): void {
    this.temp_messages = JSONUtils.parseLocalStorage(this.TEMP_MESSAGE_KEY, {});
    if (this.subject) {
      this.subject.complete();
    }
    this.token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('renwu-auth'))
      ?.split('=')[1];
    this.subject = new RxWebsocketSubject(
      `${this.settings.wsMessagesApiUrl}?renwu-token=${this.token}`,
    );

    if (this.settings.isDebug) {
      this.subject.subscribe((value: MessageEvent) => {
        console.log('Incoming message socket message:');
        console.log(JSON.stringify(value));
      });
    }

    this.subject.connectionStatus.subscribe((isConnected) => {
      this.connected.next(isConnected);
      if (isConnected) {
        // Subscribe after reconnect
        if (this.subscribeDestinationMap.size > 0) {
          this.subscribeDestinationMap.forEach((value: Destination) => {
            this.subject.send({ command: 'subscribe_chat', data: value });
          });
        }
        if (this.displayDisconnected) {
          this.toastService.success(
            this.transloco.translate('Messaging connected'),
          );
          this.toastService.clear(
            this.transloco.translate('Messaging disconnected'),
          );
        }
        this.displayDisconnected = false;
      } else {
        this.toastService.error(
          this.transloco.translate('Messaging disconnected'),
        );
        this.displayDisconnected = true;
      }
      if (isConnected) {
        this.loadLastDestinations();
      }
    });

    // this.selectedDestination.subscribe((destination) => {
    //   if (destination) {
    //     JSONUtils.setLocalStorage(
    //       'renwu_messages_last_destination',
    //       destination.info
    //     );
    //   }
    // });

    // this.setSelectedDestinationInfo(
    //   JSONUtils.parseLocalStorage<DestinationInfo>(
    //     'renwu_messages_last_destination',
    //     undefined
    //   )
    // );

    this.userService.userList.subscribe((users: User[]) => {
      this.updateUsersDestinations(users);
    });

    this.subject.subscribe((value) => {
      this.events.next(value);
      this.updateDestination(value);
    });
  }
  // setSelectedDestinationInfo(destinationInfo: DestinationInfo) {
  //   if (!destinationInfo) {
  //     this.selectedDestination.next(undefined);
  //     return;
  //   }
  //   if (!this.mapDestination.has(destinationInfo.destination.id)) {
  //     const destination = this.getOrCreateDestination(destinationInfo);
  //     this.mapDestination.set(destination.id, destination);
  //   }
  //   this.selectedDestination.next(
  //     this.mapDestination.get(destinationInfo.destination.id)
  //   );
  // }

  // Mark read
  addInQueueForMarkread(message: MessageItem) {
    message.markAsRead();
    this.markreadBuffer.next(message);
  }
  markreadAllUnreadInDestination(destination: MessageDestination) {
    this.messagingDataService
      .markreadDestination(destination.info.destination, MessageType.REGULAR)
      .subscribe();
  }
  markreadAllPulseInDestination(destination: MessageDestination) {
    this.messagingDataService
      .markreadDestination(destination.info.destination, MessageType.PULSE)
      .subscribe();
  }
  // Subscribe for live updates
  subscribeDestination(destination: Destination) {
    if (destination.id === 'new') {
      return;
    }
    this.subscribeDestinationMap.set(destination.id, destination);
    this.subject.send({ command: 'subscribe_chat', data: destination });
  }
  unsubscribeDestination(destination: Destination) {
    if (destination.id === 'new') {
      return;
    }
    this.subscribeDestinationMap.delete(destination.id);
    this.subject.send({ command: 'unsubscribe_chat', data: destination });
  }
  // Send wrapped file message
  postFileMessage(
    destination: Destination,
    url: string,
    fileName: string,
    message?: string,
  ) {
    const href = `${this.settings.mediaUrl}/${url}`;
    const imageText = message || fileName;
    let postMessage = '';

    if (testImageExtension(fileName)) {
      postMessage = `[${fileName}](${href}):\n`;
      postMessage += `![${imageText}](${href})\n`;
    } else {
      postMessage = `[${fileName}](${href})\n`;
    }

    return this.messagingDataService.postMessage({
      destination: destination,
      message: postMessage,
      isExternal: false,
    });
  }
  // Send message
  postMessage(destination: Destination, message: string, external: boolean) {
    // destination.id = "123"
    return this.messagingDataService.postMessage({
      destination: destination,
      message: message,
      isExternal: external,
    });
  }
  // Prepare fake empty message
  prepareNewMessage(
    destination: Destination,
    message: string,
    external: boolean,
  ): Message {
    const time = new Date().toISOString();
    const emptyMessage: Message = {
      id: 'sending: ' + time.toString(),
      message: message,
      createTime: time,
      editTime: time,
      destination: destination,
      isRead: true,
      isExternal: external,
      author: {
        id: this.userService.getId(),
        name: this.userService.getFullName(),
        avatarId: this.userService.getUser().avatar_id,
      },
    };
    return emptyMessage;
  }
  // Delete message
  deleteMessage(message: MessageItem): Observable<void> {
    return this.messagingDataService.deleteMessage(message.id);
  }
  // Update message
  updateMessage(
    id: string,
    text: string,
    isExternal: boolean,
  ): Observable<void> {
    return this.messagingDataService.updateMessage(
      id,
      text,
      formatISO(new Date()),
      isExternal,
    );
  }
  // FIXME: Remove this method
  // // Save open destinations to localstorage
  // saveOpenDestination(id: string, destination: DestinationInfo) {
  //   const t = JSONUtils.parseLocalStorage<Destination>(
  //     'renwu_open_destination',
  //     {},
  //   );
  //   JSONUtils.setLocalStorage(
  //     'renwu_open_destination',
  //     destination.destination,
  //   );
  // }
  // // Load open destinations from localstorage
  // loadOpenDestination(id: string) {
  //   const destination = JSONUtils.parseLocalStorage<Destination>(
  //     'renwu_open_destination',
  //     null,
  //   );
  //   if (destination[id]) {
  //     return destination[id];
  //   }
  //   return [];
  // }
  // Temp messages
  setTempMessage(destination: Destination, message: string) {
    if (!destination) {
      return;
    }
    this.temp_messages[destination.id] = message;
    JSONUtils.setLocalStorage(this.TEMP_MESSAGE_KEY, this.temp_messages);
  }
  clearTempMessage(destination: Destination) {
    if (!destination) {
      return;
    }
    this.temp_messages[destination.id] = null;
    JSONUtils.setLocalStorage(this.TEMP_MESSAGE_KEY, this.temp_messages);
  }
  getTempMessage(destination: Destination) {
    if (!destination || destination.id === 'new') {
      return '';
    }
    return this.temp_messages[destination.id] || '';
  }

  // Update last destinations on event
  updateDestination(messageEvent: MessageEvent) {
    const taskDestinations = this.taskDestinations.getValue();
    const userDestinations = this.userDestinations.getValue();

    if (messageEvent.eventType === MessageEventType.CHAT_EDIT) {
      const destination = this.getOrCreateDestination(messageEvent.chat);
      this.spliceDisplayedDestinations(
        taskDestinations,
        userDestinations,
        messageEvent.chat,
      );

      if (messageEvent.chat.destination.type === DestinationType.ISSUE) {
        taskDestinations.unshift(destination as TaskMessageDestination);
      }
      if (messageEvent.chat.destination.type === DestinationType.USER) {
        userDestinations.unshift(destination as UserMessageDestination);
      }

      this.taskDestinations.next(taskDestinations);
      this.userDestinations.next(userDestinations);
      this.updateCountMessages();
    } else if (messageEvent.eventType === MessageEventType.CHAT_REMOVE) {
      this.spliceDisplayedDestinations(
        taskDestinations,
        userDestinations,
        messageEvent.chat,
      );
      this.removeDestination(messageEvent.chat);
      this.taskDestinations.next(taskDestinations);
      this.userDestinations.next(userDestinations);
      this.updateCountMessages();

      if (this.mapDestination.has(messageEvent.chat.destination.id)) {
        this.mapDestination.set(messageEvent.chat.destination.id, null);
      }
    }
  }
  // Update unread messages
  updateCountMessages(): void {
    const taskDestinations = this.taskDestinations.getValue();
    const userDestinations = this.userDestinations.getValue();

    let unreadCount = 0;
    let pulseCount = 0;
    for (let i = 0; i < taskDestinations.length; ++i) {
      unreadCount += taskDestinations[i].unreadCount.getValue();
      pulseCount += taskDestinations[i].pulseCount.getValue();
    }
    for (let i = 0; i < userDestinations.length; ++i) {
      unreadCount += userDestinations[i].unreadCount.getValue();
      pulseCount += userDestinations[i].pulseCount.getValue();
    }
    this.unreadCount.next(unreadCount);
    this.pulseCount.next(pulseCount);
  }
  // Load last destinations
  loadLastDestinations(): void {
    this.messagingDataService
      .getLastDestinations()
      .subscribe((destinations) => {
        const taskDestinations: IMessageDestination[] = [];
        const userDestinations: IMessageDestination[] =
          this.userDestinations.getValue();

        const lastUsersDestinations: IMessageDestination[] = [];
        for (let i = 0; i < destinations.length; ++i) {
          if (
            destinations[i].destination.type === DestinationType.USER &&
            !this.mapDestination.has(destinations[i].destination.id)
          ) {
            continue;
          }
          if (destinations[i].destination.type === DestinationType.ISSUE) {
            // FIXME
            // destinations[i].unread_count = destinations[i].unread_count;
            // destinations[i].pulse_count = destinations[i].pulse_count;
            const destination = this.getOrCreateDestination(destinations[i]);
            taskDestinations.push(destination);
            this.mapDestination.set(destination.id, destination);
          }
          if (destinations[i].destination.type === DestinationType.USER) {
            // FIXME
            // destinations[i].unread_count = destinations[i].unread_count;

            const destination = this.getOrCreateDestination(destinations[i]);
            lastUsersDestinations.push(destination);
            this.mapDestination.set(destination.id, destination);
          }
        }
        for (let l = lastUsersDestinations.length - 1; l >= 0; --l) {
          for (let u = 0; u < userDestinations.length; ++u) {
            if (userDestinations[u].id === lastUsersDestinations[l].id) {
              const destination = userDestinations.splice(u, 1);
              destination[0].updateInfo(lastUsersDestinations[l].info);
              userDestinations.unshift(destination[0]);
              break;
            }
          }
        }

        this.taskDestinations.next(
          taskDestinations as TaskMessageDestination[],
        );
        this.userDestinations.next(
          userDestinations as UserMessageDestination[],
        );

        this.updateCountMessages();
      });
  }
  // Update user destinations
  updateUsersDestinations(users: User[]) {
    const userDestinations: IMessageDestination[] = [];

    for (const userOriginal of users) {
      if (
        userOriginal.type === 'dummy' ||
        userOriginal.status === 'deleted' ||
        userOriginal.status === 'pending'
      ) {
        continue;
      }
      const userDestination: UserDestinationInfo = {
        online: false,
        destination: { id: userOriginal.id, type: DestinationType.USER },
        unreadCount: 0,
        name: userOriginal.username || userOriginal.full_name,
      };
      const destination = this.getOrCreateDestination(userDestination);
      this.mapDestination.set(destination.id, destination);
      userDestinations.push(destination);
    }

    this.userDestinations.next(userDestinations as UserMessageDestination[]);
    this.loadLastDestinations();
  }

  getDestination(
    id: string,
    type?: DestinationType,
  ): Observable<MessageDestination> {
    if (this.mapDestination.has(id)) {
      return of(this.mapDestination.get(id));
    }
    return this.messagingDataService
      .getDestination(id)
      .pipe(
        catchError(() =>
          of({ id, type: type || DestinationType.UNKNOWN_DESTINATION_TYPE }),
        ),
      )
      .pipe(map((d) => this.getOrCreateDestination({ destination: d })));
  }
  getOrCreateDestination(
    info: DestinationInfo,
    options?: MessageDestinationOptions,
  ): MessageDestination {
    // TODO: Add message if this is subthread destination
    const destination =
      this.mapDestination.get(info.destination.id) ||
      (new CommonMessageDestination(this, info, options) as MessageDestination);
    destination.updateInfo(info);
    this.mapDestination.set(destination.id, destination);
    return destination;
  }
  createMessageSubDestination(message: MessageItem): MessageDestination {
    const sub = this.getOrCreateDestination(
      {
        name: message.text.getValue(),
        destination: {
          id: message.id,
          type: DestinationType.MESSAGE,
        },
        message: message,
      } as MessageDestinationInfo,
      {
        root: message.destination,
      },
    );
    message.destination.setSubDestination(sub);
    return sub;
  }
  removeDestination(info: DestinationInfo) {
    this.mapDestination.delete(info.destination.id);
  }
  spliceDisplayedDestinations(
    taskDestinations: TaskMessageDestination[],
    userDestinations: UserMessageDestination[],
    info: DestinationInfo,
  ) {
    if (info.destination.type === DestinationType.ISSUE) {
      const i = taskDestinations.findIndex((d) => d.id === info.destination.id);
      taskDestinations.splice(i, 1);
    }
    if (info.destination.type === DestinationType.USER) {
      const i = userDestinations.findIndex((d) => d.id === info.destination.id);
      userDestinations.splice(i, 1);
    }
  }
  loadSubThreads(destination: Destination) {
    return this.messagingDataService.getSubDestinations(destination);
  }
  loadMessages(
    startMessage: string,
    destination: Destination,
    past: number,
    future: number,
    withChildren: boolean,
  ) {
    return this.messagingDataService.getMessages(
      startMessage,
      destination,
      past,
      future,
      withChildren,
      false,
    );
  }
  loadPinnedMessages(destination: Destination, withChildren: boolean) {
    return this.messagingDataService.getMessages(
      undefined,
      destination,
      999999,
      0,
      withChildren,
      true,
    );
  }
  loadMessage(id: string) {
    return this.messagingDataService.getMessage(id);
  }
  addAttachment(id: string, attachment: Attachment) {
    return this.dataService.addIssueAttachment(id, attachment);
  }
  pinMessage(message: MessageItem) {
    return this.messagingDataService.pinMessage(message.id, !message.pinned);
  }
  favMessage(message: MessageItem) {
    return this.messagingDataService.favMessage(message.id, !message.favorite);
  }
  loadFavMessage() {
    return this.messagingDataService.getFavMessages();
  }
}
