import { Issue } from '../issue/issue.model';
import { WorkflowD } from '../settings/dictionary.model';
import { User, UserD } from '../user/user.model';
import { Team } from './team.model';
export enum ExternalUserScope {
  SELF = 'self',
  EXTERNAL = 'external',
}

export interface ListSettings {
  columns_width: any;
}

export interface TableSettings {
  columns_width: any;
}

export interface ContainerTimelineSettings {
  size: { issue_height: number };
}
export interface ContainerSettings {
  issue?: Issue;
  workflow?: WorkflowD;
  min_autolog_time?: number;
  auto_scheduling?: boolean;
  external_user_scope?: ExternalUserScope;
}

export interface Container {
  id?: string;
  title: string;
  archived?: boolean;
  key: string;
  external_id?: string;
  lead?: User;
  team?: Team[];
  admins?: UserD[];
  managers?: UserD[];
  settings?: ContainerSettings;
}

export interface ContainerD {
  id?: string;
  title?: string;
  key?: string;
}

export interface BacklogStat {
  id: string;
  summary: {
    label: string;
    count: number;
    estimate: number;
  }[];
  total_estimation: string;
}
