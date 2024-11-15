import { AppDateFormat } from "@renwu/components";

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
}
export interface UserSettingsServer {
  time_zone_name: string;
  profile: ProfileSettingsModel;
  notifications: NotificationSettingsModel;
  date_last_update?: string;
}
