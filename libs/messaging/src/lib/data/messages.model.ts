import { Issue, User } from '@renwu/core';

export enum DestinationType {
  // Internal use only
  FAV = 'FAV',
  UNKNOWN_DESTINATION_TYPE = 'UNKNOWN_DESTINATION_TYPE',
  USER = 'USER',
  ISSUE = 'ISSUE',
  MESSAGE = 'MESSAGE',
  CHANNEL = 'CHANNEL',
  CONTAINER = 'CONTAINER',
}

export enum MessageEventType {
  UNKNOWN = 'UNKNOWN',
  ADD = 'ADD',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  READ = 'READ',
  CHAT_EDIT = 'CHAT_EDIT',
  CHAT_REMOVE = 'CHAT_REMOVE',
  MOVE = 'MOVE',
}

export enum MessageType {
  REGULAR = 'REGULAR ',
  PULSE = 'PULSE',
}

export interface Destination {
  id: string;
  type: DestinationType;
}
export interface UserDestination extends Destination {
  type: DestinationType.USER;
  destiontion?: UserDestinationInfo;
}
export interface IssueDestination extends Destination {
  type: DestinationType.ISSUE;
  destination?: IssueDestinationInfo;
}

export interface DestinationInfo {
  name?: string;
  destination?: Destination;
  unreadCount?: number;
  pulseCount?: number;
  markCount?: number;
  lastTime?: string;
}

export interface UserDestinationInfo extends DestinationInfo {
  user?: User;
  destination?: UserDestination;
  online?: boolean;
}

export interface IssueDestinationInfo extends DestinationInfo {
  issue?: Issue;
  destination?: IssueDestination;
}

export interface MessageEvent {
  eventType: MessageEventType;
  message: Message;
  chat: DestinationInfo;
}

export interface PostMessage {
  destination: Destination;
  message: string;
  time?: string;
  isExternal?: boolean;
}

export interface Message {
  id: string;
  message: string;
  createTime: string;
  editTime: string;
  author: {
    id: string;
    name: string;
    avatarId: string;
  };
  isRead: boolean;
  destination: Destination;
  read?: string[];
  subMessagesCount?: number;
  children?: Message[];
  isMarked?: boolean;
  subMembers?: string[];
  type?: MessageType;
  isExternal?: boolean;
  payload?: string;
  favorite?: string[];
  pinned?: boolean;
}

export interface GetMessagesResult {
  items: Message[];
  leftBefore: number;
  leftAfter: number;
}

export interface SubscribeChatCommand {
  command: 'subscribe_chat';
  data?: Destination;
}

export interface UnsubscribeChatCommand {
  command: 'unsubscribe_chat';
  data?: Destination;
}

export type MessagingSendCommand =
  | SubscribeChatCommand
  | UnsubscribeChatCommand;
