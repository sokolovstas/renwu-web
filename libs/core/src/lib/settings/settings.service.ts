import { Injectable } from '@angular/core';
import { RwToastService } from '@renwu/components';
import { Observable, of, tap } from 'rxjs';
import { SystemSettings } from '../data/common.model';

import { RwDataService } from '../data/data.service';
import { NotificationsSettings } from './settings-notification';
import { UserSettings } from './settings-user';
import { UserSettingsServer } from './settings.model';

@Injectable({
  providedIn: 'root',
})
export class RwSettingsService {
  settings: SystemSettings;
  user: UserSettings = new UserSettings(this);
  notifications: NotificationsSettings = new NotificationsSettings(this);
  userID: string;

  constructor(
    private dataService: RwDataService,
    private toastService: RwToastService,
  ) {}
  init(userID: string) {
    this.userID = userID;
    this.user = UserSettings.load(this);
    return of(true);
  }
  resetUserSettings(): Observable<any> {
    localStorage.removeItem(`renwu_user_settings_${this.userID}`);
    this.user = UserSettings.load(this);
    return this.saveSettings();
  }
  resetAllSettings(): Observable<any> {
    localStorage.removeItem(`renwu_timeline_settings_${this.userID}`);
    localStorage.removeItem(`renwu_workload_settings_${this.userID}`);
    localStorage.removeItem(`renwu_column_width_${this.userID}`);
    localStorage.removeItem(`renwu_user_settings_${this.userID}`);
    this.user = UserSettings.load(this);
    return this.saveSettings();
  }

  loadSettings(): void {
    this.dataService.getSettings('system').subscribe((data) => {
      this.settings = data;
    });
    this.dataService.getUserSettings('').subscribe((data) => {
      if (!data.date_last_update) {
        this.saveSettings();
      } else {
        this.user.updateProfileSettings(data.profile);
        this.notifications.updateSettings(data.notifications);
      }
      // locale(this.user.formats);
    });
  }
  saveSettings() {
    const settingsForSave: UserSettingsServer = {
      time_zone_name: this.user.time_zone_name,
      profile: this.user.settings,
      notifications: this.notifications.settings,
    };
    const upsert = this.dataService.saveUserSettings(
      '',
      // FIXME: fix typings
      settingsForSave,
    );
    upsert.pipe(
      tap((data) => {
        this.user.updateProfileSettings(data.profile);
        this.notifications.updateSettings(data.notifications);
      }),
    );
    return upsert;
  }
  getDefaultSettings(): UserSettingsServer {
    return {
      time_zone_name: new UserSettings(this).time_zone_name,
      profile: new UserSettings(this).settings,
      notifications: new NotificationsSettings(this).settings,
    };
  }
  getNotificationsChannelsSection(section: 'messaging' | 'pulse'): string[] {
    switch (section) {
      case 'messaging':
        return Object.keys(this.notifications.channels).filter((v) =>
          ['mention_messages', 'messages'].includes(v),
        );
      case 'pulse':
        return Object.keys(this.notifications.channels).filter(
          (v) => !['mention_messages', 'messages'].includes(v),
        );
    }
  }
}
