import { NotificationSettingsModel } from './settings.model';
import { RwSettingsService } from './settings.service';

export class NotificationsSettings {
  settings: NotificationSettingsModel = {
    channels: {
      assigned_to_me: ['push'],
      assignes: ['push'],
      attachments: ['push'],
      completion: ['push'],
      estimated_time: ['push'],
      mention_messages: ['push'],
      messages: ['push'],
      milestones: ['push'],
      parent_messaging: ['push'],
      parent_pulse: ['push'],
      priority: ['push'],
      status: ['push'],
      time_logged: ['push'],
      todos: ['push'],
      watched_by_me: ['push'],
      watchers: ['push'],
    },
  };
  main: RwSettingsService;
  // FIXME: remove this
  // timeout: any;

  static load(main: any): NotificationsSettings {
    const result: NotificationsSettings = new NotificationsSettings(main);
    return result;
  }

  constructor(main: any) {
    this.main = main;
  }

  set channels(value: NotificationSettingsModel['channels']) {
    this.settings.channels = value;
  }
  get channels(): NotificationSettingsModel['channels'] {
    return this.settings.channels;
  }

  updateSettings(settings: any) {
    if (!settings) {
      return;
    }
    Object.assign(this.settings.channels, settings.channels);
    this.settings = {
      channels: { ...this.settings.channels, ...settings.channels },
    };
  }

  save(): void {
    this.main.saveSettings();
  }
}
