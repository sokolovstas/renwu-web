import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  AppDateFormat,
  RwButtonComponent,
  RwCheckboxComponent,
  RwColorPickerComponent,
  RwSelectComponent,
  RwTextInputComponent,
} from '@renwu/components';
import {
  AppLangs,
  AppThemes,
  AvatarComponent,
  CheckUserValidator,
  NotificationSettingsChannels,
  ProfileSettingsModel,
  RwDataService,
  StateService,
} from '@renwu/core';
import { firstValueFrom, tap } from 'rxjs';
import { UserService } from '../user.service';

@Component({
  selector: 'renwu-profile-settings',
  standalone: true,
  imports: [
    RwColorPickerComponent,
    AvatarComponent,
    RwSelectComponent,
    RwTextInputComponent,
    RwCheckboxComponent,
    RwButtonComponent,
    ReactiveFormsModule,
    RenwuPageComponent,
    AsyncPipe,
    TranslocoPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  workHours = { 0: false, 1: false, 2: false, 3: false };
  userService = inject(UserService);
  stateService = inject(StateService);
  dataService = inject(RwDataService);
  transloco = inject(TranslocoService);

  user = this.userService.currentUser.pipe(
    tap((t) => this.userForm.patchValue(t)),
  );

  userForm = new FormGroup(
    {
      id: new FormControl(''),
      full_name: new FormControl('', {
        validators: [Validators.minLength(2)],
      }),
      phone: new FormControl(''),
      initials_text: new FormControl(''),
      initials_color: new FormControl(''),
      settings: new FormGroup({
        time_zone_name: new FormControl(''),
        profile: new FormGroup({
          language: new FormControl<ProfileSettingsModel['language']>(
            AppLangs.EN,
          ),
          formats: new FormControl<ProfileSettingsModel['formats']>(
            AppDateFormat.EN_US,
          ),
          relative_dates: new FormControl(true),
          theme: new FormControl<ProfileSettingsModel['theme']>(AppThemes.AUTO),
          send_with_modifier_key: new FormControl(false),

          labs: new FormGroup({
            global_milestones: new FormControl(false),
          }),
        }),
        notifications: new FormGroup({
          channels: new FormControl<NotificationSettingsChannels>({}),
        }),
      }),
    },
    {
      asyncValidators: [this.checkUser.validate.bind(this.checkUser)],
    },
  );
  constructor(private checkUser: CheckUserValidator) {}
  async saveUser() {
    firstValueFrom(this.userService.saveUser(this.userForm.value as any));
    this.transloco.setActiveLang(this.userForm.value.settings.profile.language);
    this.transloco.ngOnDestroy();
  }
}
