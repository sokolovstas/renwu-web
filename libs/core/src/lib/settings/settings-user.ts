import { AppDateFormat, RwDatePipe } from '@renwu/components';
import { JSONUtils } from '@renwu/utils';
import { Subject } from 'rxjs';
import {
  AppLangs,
  AppThemes,
  ProfileSettingsModel,
} from './settings.model';
import { RwSettingsService } from './settings.service';

export class UserSettings {
  settings: ProfileSettingsModel = {
    language: AppLangs.EN,
    formats: AppDateFormat.EN_US,
    open_index_group: {},
    send_with_modifier_key: false,
    theme: AppThemes.AUTO,
    labs: {
      global_milestones: false,
    },
    tasks_view: 'recent',
    relative_dates: true,
  };
  time_zone_name: string = globalThis.Intl
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : '';
  main: RwSettingsService;
  // FIXME: remove this
  // timeout: any;
  updated = new Subject<void>();

  static load(main: RwSettingsService): UserSettings {
    const result: UserSettings = new UserSettings(main);
    result.updateProfileSettings(
      JSONUtils.parseLocalStorage<ProfileSettingsModel>(
        `renwu_user_settings_${main.userID}`,
        new UserSettings(this).settings,
      ),
    );
    RwDatePipe.setLocale(result.formats);
    return result;
  }

  constructor(main: any) {
    this.main = main;
  }

  set language(value: ProfileSettingsModel['language']) {
    this.settings.language = value;
    this.save();
  }
  get language(): ProfileSettingsModel['language'] {
    return this.settings.language;
  }
  ////////////////////////////////////////////
  set formats(value: ProfileSettingsModel['formats']) {
    this.settings.formats = value;
    this.save();
  }
  get formats(): ProfileSettingsModel['formats'] {
    return this.settings.formats || AppDateFormat.EN_US;
  }
  ////////////////////////////////////////////
  set send_with_modifier_key(value: boolean) {
    this.settings.send_with_modifier_key = value;
    this.save();
  }
  get send_with_modifier_key(): boolean {
    return this.settings.send_with_modifier_key;
  }
  ////////////////////////////////////////////
  set theme(value: ProfileSettingsModel['theme']) {
    this.settings.theme = value;
    this.save();
  }
  get theme(): ProfileSettingsModel['theme'] {
    return this.settings.theme;
  }
  ////////////////////////////////////////////
  set labs(value: ProfileSettingsModel['labs']) {
    this.settings.labs = value;
    this.save();
  }
  get labs(): ProfileSettingsModel['labs'] {
    return this.settings.labs;
  }
  ////////////////////////////////////////////
  set tasks_view(value: string) {
    this.settings.tasks_view = value;
    this.save();
  }
  get tasks_view(): string {
    return this.settings.tasks_view;
  }
  ////////////////////////////////////////////
  set relative_dates(value: boolean) {
    this.settings.relative_dates = value;
    this.save();
  }
  get relative_dates(): boolean {
    return this.settings.relative_dates;
  }

  get relativeDateFormat(): string {
    return this.settings.relative_dates ? 'fromNow' : 'LLL';
  }
  ////////////////////////////////////////////
  set labs_global_milestones(value: boolean) {
    this.settings.labs.global_milestones = value;
    this.save();
  }
  get labs_global_milestones(): boolean {
    return this.settings.labs.global_milestones;
  }

  // isColumnVisible(view: ProfileSettingsTableColumns, key: string): boolean {
  //   try {
  //     return !this.settings.table.columns[view][key].hidden;
  //   } catch (err) {
  //     return true;
  //   }
  // }
  // setColumnVisible(
  //   view: ProfileSettingsTableColumns,
  //   key: string,
  //   value: boolean
  // ): void {
  //   if (!this.settings.table.columns[view]) {
  //     this.settings.table.columns[view] = {};
  //   }
  //   if (!this.settings.table.columns[view][key]) {
  //     this.settings.table.columns[view][key] = {};
  //   }
  //   this.settings.table.columns[view][key].hidden = !value;
  //   this.save();
  // }

  updateProfileSettings(settings: ProfileSettingsModel): void {
    if (!settings) {
      return;
    }
    Object.assign(settings, this.settings);
    // for (const key in this.settings) {
    //   if (key in settings && key === 'table') {
    //     if (!settings.table.columns) {
    //       settings.table.columns = this.settings.table.columns;
    //     } else {
    //       for (const view in this.settings.table.columns) {
    //         if (
    //           !(view in this.settings.table.columns) ||
    //           this.settings.table.columns[
    //             view as ProfileSettingsTableColumns
    //           ] === null
    //         ) {
    //           settings.table.columns[view as ProfileSettingsTableColumns] =
    //             Object.assign(
    //               settings.table.columns[view as ProfileSettingsTableColumns] ||
    //                 {},
    //               this.settings.table.columns[
    //                 view as ProfileSettingsTableColumns
    //               ]
    //             );
    //         }
    //       }
    //     }
    //   }
    // }
    this.settings = settings;
    this.saveInlocalStorage();
    this.updated.next();

    // for (const key in this.settings) {
    //   if (!settings.hasOwnProperty(key) || settings[key] === null) {
    //     settings[key] = this.settings[key];
    //   }
    //   if (settings.hasOwnProperty(key) && key === 'table') {
    //     for (const view in this.settings[key]) {
    //       if (this.settings[key].hasOwnProperty(key)) {
    //         if (!this.settings[key].hasOwnProperty(view) || this.settings[key][view] === null) {
    //           settings[key][view] = Object.assign(settings[key][view] || {}, this.settings[key][view]);
    //         }
    //       }
    //     }
    //   }
    // }
    // this.settings = settings;
    // this.saveInlocalStorage();
    // this.updated.next();
  }

  saveInlocalStorage(): void {
    JSONUtils.setLocalStorage(
      `renwu_user_settings_${this.main.userID}`,
      this.settings,
    );
  }

  save() {
    this.saveInlocalStorage();
    this.main.saveSettings();
  }
}
