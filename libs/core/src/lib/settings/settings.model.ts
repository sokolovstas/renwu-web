import { AppDateFormat } from '@renwu/components';

import type { TaskDetailLayoutFieldKey } from './task-detail-layout.model';

export enum TimelineTicksId {
  FIT = 'fit',
  DAY = 'day',
  WEEK = 'week',
  QUARTER = 'quarter',
}

export enum AppThemes {
  AUTO = 'auto',
  DARK = 'dark',
  LIGHT = 'light',
}

export enum AppLangs {
  RU = 'ru',
  EN = 'en',
}

export interface TimelineScaleTickServer {
  id: TimelineTicksId;
  value: number;
}
export interface TimelineScaleTick {
  title: string;
  id: TimelineTicksId;
  scale: number;
  min: number;
}

export type NotificationSettingsChannels = Partial<
  Record<
    | 'assigned_to_me'
    | 'assignes'
    | 'attachments'
    | 'completion'
    | 'estimated_time'
    | 'mention_messages'
    | 'messages'
    | 'milestones'
    | 'parent_messaging'
    | 'parent_pulse'
    | 'priority'
    | 'status'
    | 'time_logged'
    | 'todos'
    | 'watched_by_me'
    | 'watchers',
    Array<'push' | 'email'>
  >
>;

export interface NotificationSettingsModel {
  channels: NotificationSettingsChannels;
}

/** How parent/child trees are shown in the timeline. */
export type TimelineHierarchyMode = 'subtasks' | 'leaves';

/** Timeline UI preferences stored in user profile (`profile.timeline`). */
export interface TimelineProfileSettings {
  grouping?: string;
  /** `subtasks` = full tree under roots; `leaves` = only leaf issues. */
  hierarchyMode?: TimelineHierarchyMode;
  scaleTick?: TimelineTicksId;
  scaleValue?: number;
  showMilestones?: boolean;
  showTitleRight?: boolean;
  showWorkforce?: boolean;
  tableWidth?: number;
  open_index?: Record<string, boolean>;
  open_index_group?: Record<string, boolean>;
  sort?: { field?: string; direction?: string };
  /** `true` = full 24h day axis; `false` = compressed 8h workday axis. */
  hours24InDay?: boolean;
  workforceHeight?: { id: string; value: number } | null;
}

export interface ProfileSettingsModel {
  language: AppLangs;
  formats: AppDateFormat;
  open_index_group: Record<string, boolean>;
  send_with_modifier_key: boolean;
  theme: AppThemes;
  labs: {
    global_milestones: boolean;
  };
  tasks_view: string;
  relative_dates: boolean;
  /**
   * Per project (container id): which task detail fields/blocks are hidden.
   * Absent container id or empty list means “show all” for that project.
   */
  task_detail_hidden_by_container?: Record<string, TaskDetailLayoutFieldKey[]>;
  timeline?: TimelineProfileSettings;
}
export interface UserSettingsServer {
  time_zone_name: string;
  profile: ProfileSettingsModel;
  notifications: NotificationSettingsModel;
  date_last_update?: string;
}
