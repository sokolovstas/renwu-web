import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RwPageComponent } from '@renwu/app-ui';
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
  AvatarEditorComponent,
  NotificationSettingsChannels,
  ProfileSettingsModel,
  User,
} from '@renwu/core';
import {
  firstValueFrom,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { UserService } from '../user.service';

@Component({
  selector: 'renwu-profile-settings',
  standalone: true,
  imports: [
    RwColorPickerComponent,
    AvatarEditorComponent,
    RwSelectComponent,
    RwTextInputComponent,
    RwCheckboxComponent,
    RwButtonComponent,
    ReactiveFormsModule,
    RwPageComponent,
    AsyncPipe,
    TranslocoPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  userService = inject(UserService);
  transloco = inject(TranslocoService);

  @ViewChild(AvatarEditorComponent)
  avatarEditor?: AvatarEditorComponent;

  private formInitialized = false;

  userForm = new FormGroup({
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
        language: new FormControl<ProfileSettingsModel['language']>(AppLangs.EN),
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
  });

  initialsText = toSignal(
    this.userForm.controls.initials_text.valueChanges.pipe(
      startWith(this.userForm.controls.initials_text.value),
    ),
    { initialValue: '' },
  );

  initialsColor = toSignal(
    this.userForm.controls.initials_color.valueChanges.pipe(
      startWith(this.userForm.controls.initials_color.value),
    ),
    { initialValue: '' },
  );

  private sourceUser = this.userService.currentUser.pipe(
    map((user) => {
      if (user && (!this.formInitialized || !this.userForm.dirty)) {
        this.userForm.patchValue(user);
        this.userForm.markAsPristine();
        this.formInitialized = true;
      }
      return user;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  previewUser = this.sourceUser.pipe(
    switchMap((user) =>
      user
        ? merge(of(null), this.userForm.valueChanges).pipe(
            map(
              () =>
                ({
                  ...user,
                  ...this.userForm.getRawValue(),
                }) as User,
            ),
          )
        : of(null),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  async saveUser() {
    await this.avatarEditor?.applyDraft();
    await firstValueFrom(
      this.userService.saveUser(this.userForm.getRawValue() as any),
    );
    this.userForm.markAsPristine();
    this.transloco.setActiveLang(this.userForm.value.settings.profile.language);
  }
}
