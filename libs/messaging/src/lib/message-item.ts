import { PulseIssueChangeEvent, PulseItemPayload } from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import { getUnixTime } from 'date-fns';
import { BehaviorSubject, Subject } from 'rxjs';
import { Message, MessageType } from './data/messages.model';
import { MessageDestination } from './message-destination';

export class MessageItem {
  id: string;
  message: Message;
  children: MessageItem[];
  prevMessage: MessageItem;
  nextMessage: MessageItem;
  subMembers: string[];
  author: {
    id: string;
    name: string;
    avatarId: string;
  };
  type: MessageType;
  subMessageCount: number;
  createTime: Date;
  editTime: Date;
  read: string[];
  isMarked: boolean;
  isExternal: boolean;
  text: BehaviorSubject<string>;
  favorite: boolean;
  pinned: boolean;

  destination: MessageDestination;
  subDestination: MessageDestination;
  showAvatar: boolean;
  eventTime: Date;
  readTime: Date;
  isRead: boolean;
  updated: Subject<void> = new Subject();

  isExternalAuthor: boolean;
  isExternalMessage: boolean;
  fullNameAuthor: string;
  isMessageAuthor: boolean;
  canStartThread: boolean;
  emoji: boolean;
  datetime: Date;
  displayAvatar: BehaviorSubject<boolean>;
  displayChilds: boolean;
  sendError: boolean;
  sending: boolean;
  new: BehaviorSubject<boolean>;

  newsData: PulseIssueChangeEvent;

  constructor(message: Message, destination: MessageDestination) {
    this.message = message;
    this.destination = destination;

    this.id = message.id;

    this.author = this.message.author;

    if (this.destination) {
      const userService = this.destination.service.userService;
      this.favorite = this.message.favorite
        ? this.message.favorite.indexOf(
            this.destination.service.userService.getId(),
          ) > -1
        : false;
      this.isExternalAuthor = userService.getIsExternal(this.message.author);
      this.isExternalMessage =
        !userService.getIsExternal() && this.message.isExternal;
      this.fullNameAuthor = userService.getFullName(this.message.author);
      this.isMessageAuthor =
        this.message.author &&
        this.message.id &&
        this.message.author.id === userService.getUser().id;
    }

    this.text = new BehaviorSubject('');
    this.displayAvatar = new BehaviorSubject(false);
    this.new = new BehaviorSubject(false);

    this.updateFlags();

    this.isRead = this.message.isRead;
    this.canStartThread = !!this.message.id;

    this.updateNew();
    this.updateText(this.message.message);
  }
  updateFlags(): void {
    this.subMembers = this.message.subMembers;

    this.type = this.message.type;
    this.subMessageCount = this.message.subMessagesCount;
    this.createTime = this.message.createTime
      ? new Date(this.message.createTime)
      : new Date(0);
    this.editTime = this.message.editTime
      ? new Date(this.message.editTime)
      : this.createTime;

    this.read = this.message.read;
    this.isMarked = this.message.isMarked;
    this.isExternal = this.message.isExternal;
    this.pinned = this.message.pinned || false;

    this.datetime = this.createTime;

    this.eventTime = new Date();

    if (this.message.payload) {
      const userService = this.destination.service.userService;
      const changes = JSONUtils.parse<PulseItemPayload>(
        this.message.payload,
        undefined,
      );
      this.newsData = {
        author: userService.getUserById(this.message.author.id),
        fields_changes: changes,
        date: new Date(this.message.createTime).getTime(),
        source_id: changes[0].id,
        type: undefined,
        source: {
          id: changes[0].id,
          key: changes[0].key,
          title: changes[0].title,
        },
      };
    }

    this.updated.next();
  }
  markAsRead(): void {
    this.destination.service.markreadBuffer.next(this);
    this.message.isRead = true;
    this.isRead = true;
    this.updateNew();
  }
  updateId(id: string): void {
    this.id = id;
    this.message.id = id;
    this.canStartThread = !!this.message.id;
    this.updateFlags();
  }
  setSendError(): void {
    this.sending = false;
    this.sendError = true;
  }
  setSending(): void {
    this.sending = true;
    this.sendError = false;
  }
  setSended(): void {
    this.sending = false;
    this.sendError = false;
  }
  updateText(text: string): void {
    this.message.message = text;
    this.emoji = text && text[0] === ':' && text[text.length - 1] === ':';
    this.text.next(text);
  }
  updatePrev(prev: MessageItem): void {
    this.prevMessage = prev;

    const hideAuthor =
      this.prevMessage &&
      this.prevMessage.author.id === this.author.id &&
      this.prevMessage.type === this.type &&
      getUnixTime(this.createTime) - getUnixTime(this.prevMessage.createTime) <
        30 &&
      this.prevMessage.isExternal === this.isExternal;

    this.displayAvatar.next(
      this.showAvatar ||
        !hideAuthor ||
        this.editTime.getTime() !== this.createTime.getTime(),
    );

    this.updateNew();
  }
  updateNext(next: MessageItem): void {
    this.nextMessage = next;
  }
  private updateNew(): void {
    this.new.next(
      !!this.prevMessage && !this.isRead && this.prevMessage.isRead,
    );
  }
  pin(): void {
    this.destination.service.pinMessage(this).subscribe(() => {
      this.message.pinned = !this.pinned;
      this.updateFlags();
      this.destination.messagesMapToArray();
    });
  }
  fav(): void {
    this.destination.service.favMessage(this).subscribe(() => {
      this.favorite = !this.favorite;
      this.updated.next();
    });
  }
}
