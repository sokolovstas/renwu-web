import { Container } from '../container/container.model';
import { Milestone } from '../container/milestone.model';
import { Issue } from '../issue/issue.model';
import { User } from '../user/user.model';

export interface Priority {
  id: string;
  sort: number;
  label: string;
  color: string;
  symbol: string;
  default: boolean;
}
export interface Type {
  id: string;
  sort: number;
  label: string;
  color: string;
  symbol: string;
  default: boolean;
}
export interface Resolution {
  id: string;
  sort: number;
  label: string;
  color: string;
  symbol: string;
  default: boolean;
}
export interface Status {
  id: string;
  sort: number;
  label: string;
  color: string;
  symbol: string;
  closed: boolean;
  completed: boolean;
  log_time: boolean;
  in_progress: boolean;
  account_time: boolean;
  rebot: boolean;
  default: boolean;
}

export interface WorkflowTransition {
  label: string;
  step: Status;
  to: Status;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  transitions: WorkflowTransition[];
}

export interface WorkflowD {
  id: string;
  title: string;
}

export interface HolidayCalendar {
  id: string;
  days_holiday: string[];
  is_default: boolean;
  title: string;
}
export type DictionariesTypes =
  | Type
  | string
  | WorkflowD
  | Priority
  | Status
  | Resolution
  | User
  | Container
  | Milestone
  | Issue
  | HolidayCalendar
  | WorkflowTransition;

export type DictionariesDestinations =
  | 'dictionary/labels'
  | 'dictionary/workflows'
  | 'dictionary/type'
  | 'dictionary/priority'
  | 'dictionary/status'
  | 'dictionary/resolution'
  | 'dictionary/skills'
  | 'dictionary/user_types'
  | 'user'
  | 'container'
  | 'milestone'
  | 'user/options'
  | 'issue/options'
  | 'holidays'
  | 'issue/:id/transitions'
  | 'container/:id/labels'
  | 'container/:id/milestone'
  | 'container/:id/team_skills';
