export interface WorkbotEvent {
  type: string;
}

export type IssueEventType =
  | 'issue_create'
  | 'issue_parent_update'
  | 'issue_links_update'
  | 'issue_sort_changed'
  | 'issue_delete'
  | 'issue_update'
  | 'issue_transition'
  | 'issue_timelog'
  | 'issue_unasigned'
  | 'issue_replanned';

export type ContainerEventType =
  | 'container_create'
  | 'container_delete'
  | 'container_update'
  | 'container_milestone_update';

export type UserEventType =
  | 'user_create'
  | 'user_delete'
  | 'user_update'
  | 'user_settings_update';

export interface IssueEvent {
  type: IssueEventType;
  issues: string[];
  container: string;
  user: string;
}
export interface ContainerEvent {
  type: ContainerEventType;
  issues: string[];
  container: string;
}
export interface ConnectionEvent {
  user: string;
  view: {
    path: string;
    ids: string[];
  };
}

export type ConnectionEvents = ConnectionEvent[];
export interface UserEvent {
  type: UserEventType;
  user: string;
}
export interface WorkbotEventWrapper {
  type: 'workbot';
  data: WorkbotEvent;
}

export interface IssueEventWrapper {
  type: 'issue';
  data: IssueEvent;
}

export interface ContainerEventWrapper {
  type: 'container';
  data: ContainerEvent;
}

export interface ConnectionEventsWrapper {
  type: 'connections';
  data: ConnectionEvents;
}

export interface UserEventWrapper {
  type: 'user';
  data: UserEvent;
}

export interface PongEvent {
  type: 'pong';
  data: null;
}

export interface ReceiveCommand {
  type: string;
  data: unknown;
}

export type CoreEventWrapper =
  | WorkbotEventWrapper
  | IssueEventWrapper
  | ContainerEventWrapper
  | ConnectionEventsWrapper
  | UserEventWrapper
  | PongEvent;

export interface PingCommand {
  command: 'ping';
}

export interface SendViewCommand {
  command: 'view';
  data?: Record<string, unknown>;
}

export type CoreSendCommand = SendViewCommand;

export interface ContainerEventWrapper {
  type: 'container';
  data: ContainerEvent;
}
