import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
  RwToastService,
} from '@renwu/components';
import { NotificationSettingsChannels, RwSettingsService } from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-profile-notifications',
  standalone: true,
  imports: [
    RenwuPageComponent,
    RwCheckboxComponent,
    RwSortTableDirective,
    RwSortTableColumnDirective,
    RwSortTableColumnHeadDirective,
    RwSortTableRowDirective,
    RwButtonComponent,
    FormsModule,
    TranslocoPipe,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements AfterViewInit {
  cd = inject(ChangeDetectorRef);
  settings = inject(RwSettingsService);
  toast = inject(RwToastService);
  messagingKeys = this.settings.getNotificationsChannelsSection('messaging');
  pulseKeys = this.settings.getNotificationsChannelsSection('pulse');
  transloco = inject(TranslocoService);

  notifications = JSONUtils.jsonClone(
    this.settings.notifications.settings.channels,
  );

  ngAfterViewInit() {
    this.notifications = JSONUtils.jsonClone(
      this.settings.notifications.settings.channels,
    );
  }

  translate(key: string) {
    /**
     * t(profile.notification-channel-assigned_to_me)
     * t(profile.notification-channel-assignes)
     * t(profile.notification-channel-attachments)
     * t(profile.notification-channel-completion)
     * t(profile.notification-channel-estimated_time)
     * t(profile.notification-channel-mention_messages)
     * t(profile.notification-channel-messages)
     * t(profile.notification-channel-milestones)
     * t(profile.notification-channel-parent_messaging)
     * t(profile.notification-channel-parent_pulse)
     * t(profile.notification-channel-priority)
     * t(profile.notification-channel-status)
     * t(profile.notification-channel-time_logged)
     * t(profile.notification-channel-todos)
     * t(profile.notification-channel-watched_by_me)
     * t(profile.notification-channel-watchers)
     */
    const locale = this.transloco.translate(
      `profile.notification-channel-${key}`,
    );
    return locale;
  }
  async save() {
    this.settings.notifications.settings.channels = this.notifications;
    await firstValueFrom(this.settings.saveSettings());
    this.toast.success(
      this.transloco.translate('profile.notification-settings-saved'),
    );
  }
  getCheckbox(key: string, type: 'email' | 'push') {
    return this.notifications[
      key as keyof NotificationSettingsChannels
    ].includes(type);
  }
  setCheckbox(keys: string[], type: 'email' | 'push', value: any) {
    keys.forEach((key) => {
      const channel = key as keyof NotificationSettingsChannels;
      if (!value) {
        this.notifications[channel] = this.notifications[channel].filter(
          (i) => i !== type,
        );
      } else {
        this.notifications[channel].push(type);
      }
    });
    this.cd.detectChanges();
  }
}
