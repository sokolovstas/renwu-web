import { ContainerD } from '../container/container.model';
import { Milestone, MilestoneD } from '../container/milestone.model';
import {
  Priority,
  Resolution,
  Status,
  Type,
} from '../settings/dictionary.model';
import { User, UserD } from '../user/user.model';

export interface TimeLog {
  value: number;
  completion: number;
  comment: string;
  date_created?: string;
  date_started?: string;
  author: UserD;
}
export interface IssueTodo {
  is_done: boolean;
  description: string;
}
export interface Attachment {
  id: string;
  file_name: string;
  url: string;
  owner: UserD;
  date_created: string;
  source: string;
}
export interface IssueLink {
  id: string;
  title: string;
  key: string;
  have_childs: boolean;
  date_start: string;
  date_end: string;
  status: Status;
}

export interface IssueLinks {
  prev_issue?: IssueLink[];
  next_issue?: IssueLink[];
  parent?: IssueLink[];
  related?: IssueLink[];
}

export interface TimeLogsValue {
  value: { duration: number };
  date_created?: { time: string };
}
export interface Issue {
  id?: string | 'new';
  title?: string;
  key?: string;
  keys?: string[];
  description?: string;
  labels?: string[];
  priority?: Priority;
  type?: Type;
  resolution?: Resolution;
  status?: Status;
  container?: ContainerD;
  milestones?: MilestoneD[];
  affected_versions?: MilestoneD[];
  date_created?: string;
  date_start?: string;
  date_end?: string;
  date_last_update?: string;
  date_status_changed?: string;
  date_start_progress?: string;
  estimated_time?: number;
  assignes?: UserD[];
  watchers?: UserD[];
  reporter?: User;
  time_logged?: number;
  time_logs?: TimeLog[];
  completion?: number;
  sort?: number;
  // sort_user?: number;
  // sort_bot?: number;
  skill?: string;
  childs?: Issue[];
  auto_scheduling?: boolean;
  custom_fields?: { [key: string]: string };
  external_links?: { [key: string]: string };
  parent_milestones?: MilestoneD[];
  parents_title?: string;
  todos?: IssueTodo[];
  assignes_calc?: UserD[];
  date_start_calc?: string;
  date_end_calc?: string;
  date_released?: string;
  have_childs?: boolean;
  childs_total?: number;
  childs_resolved?: number;
  childs_estimated_total?: string;
  childs_estimated_resolved?: string;
  fav_users?: string[];
  version?: number;
  // events;
  attachments?: Attachment[];
  links?: IssueLinks;
  is_external?: boolean;

  // __early_milestone_id?: string;
  // __is_selected?: boolean;
  // __smartLabels?: string[];
  // __score?: number;

  // __markForCheckItemTable?: () => void;
  // __markForCheckItemGraph?: () => void;
  // __markForCheckFlagGraph?: () => void;
  // _SHOWCHILDS?: boolean;
  // __justAdded?: boolean;
  // __selected?: boolean;

  // __opacity?: number;
}

export interface IssueGroup {
  id: string;
  uid: string;
  issues: Issue[];
  key: Type | Milestone | User | null;
}

export interface IssueExistResponse {
  result: boolean;
}
export interface IssueElapsedTime {
  absolute_time: string;
  date_start: string;
  guess_time: string;
  working_time: string;
}

export interface FieldChangesTimeLogs {
  field_name: 'time_logs';
  new_value: TimeLogsValue[];
  old_value: TimeLogsValue[];
}

export interface FieldChangesLinks {
  field_name: 'links';
  new_value: IssueLinks;
  old_value: IssueLinks;
}

export interface FieldChangesAutoScheduling {
  field_name: 'auto_scheduling';
  new_value: boolean;
  old_value: boolean;
}

export interface FieldChangesAttachments {
  field_name: 'attachments';
  new_value: Attachment[];
  old_value: Attachment[];
}

export interface FieldChangesToDo {
  field_name: 'todos';
  new_value: IssueTodo[];
  old_value: IssueTodo[];
}

export interface FieldChangesUser {
  field_name: 'watchers' | 'assignes';
  new_value: UserD[];
  old_value: UserD[];
}

export interface FieldChangesString {
  field_name: 'description' | 'title';
  new_value: string;
  old_value: string;
}

export interface FieldChangesNumber {
  field_name: 'completion';
  new_value: number;
  old_value: number;
}

export interface FieldChangesStrings {
  field_name: 'skill' | 'labels';
  new_value: string[];
  old_value: string[];
}

export interface FieldChangesMilestones {
  field_name: 'milestones' | 'affected_versions';
  new_value: MilestoneD[];
  old_value: MilestoneD[];
}

export interface FieldChangesTime {
  field_name: 'time_logged' | 'estimated_time';
  new_value: { duration: number };
  old_value: { duration: number };
}

export interface FieldChangesDate {
  field_name: 'date_start' | 'date_end';
  new_value: { time: string };
  old_value: { time: string };
}

export interface FieldChangesContainer {
  field_name: 'container';
  new_value: ContainerD;
  old_value: ContainerD;
}

export interface FieldChangesPriority {
  field_name: 'priority';
  new_value: Priority;
  old_value: Priority;
}

export interface FieldChangesStatus {
  field_name: 'status';
  new_value: Status;
  old_value: Status;
}

export interface FieldChangesType {
  field_name: 'type';
  new_value: Type;
  old_value: Type;
}

export type FieldChanges =
  | FieldChangesTimeLogs
  | FieldChangesLinks
  | FieldChangesAutoScheduling
  | FieldChangesAttachments
  | FieldChangesToDo
  | FieldChangesUser
  | FieldChangesString
  | FieldChangesMilestones
  | FieldChangesTime
  | FieldChangesDate
  | FieldChangesContainer
  | FieldChangesStrings
  | FieldChangesPriority
  | FieldChangesStatus
  | FieldChangesType
  | FieldChangesNumber;
export interface IssueChangeEvent {
  id: string;
  source_id: string;
  source: {
    id: Issue['id'];
    title: Issue['title'];
    key: Issue['key'];
    have_childs: Issue['have_childs'];
    date_start: Issue['date_start'];
    date_end: Issue['date_end'];
  };
  target_id: string;
  target: null;
  author_id: string;
  golbal_author_id: string;
  author: {
    id: User['id'];
    username: User['username'];
    full_name: User['full_name'];
    avatar_id: User['avatar_id'];
  };
  changes: string;
  date: string;
  type: string;
  readed: string[];
  fields_changes: PulseItemPayload;
}

export interface PulseIssueChangePayload {
  id: Issue['id'];
  title: Issue['title'];
  key: Issue['key'];
}

export interface PulseIssueChangeEvent {
  source_id: string;
  source: {
    id: Issue['id'];
    title: Issue['title'];
    key: Issue['key'];
  };
  author?: User;
  date?: number;
  type?: undefined;
  fields_changes: PulseItemPayload;
}
export interface IssueChilds {
  childs: Issue[];
  childs_completed_total: number;
  childs_estimated_total: number;
  childs_resolved: number;
  childs_total: number;
}

export type PulseItemPayload = (FieldChanges & PulseIssueChangePayload)[];
