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
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  AppDateFormat,
  RwButtonComponent,
  RwCheckboxComponent,
  RwColorPickerComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import {
  AppLangs,
  AvatarComponent,
  AvatarEditorComponent,
  CheckUserValidator,
  HolidayCalendar,
  ProfileSettingsModel,
  RW_CORE_SETTINGS,
  RwDataService,
  RwUserService,
  StateService,
  User,
  UserStatus,
  UserType,
} from '@renwu/core';
import { copyToClipboard } from '@renwu/utils';
import {
  firstValueFrom,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'renwu-settings-user',
  standalone: true,
  imports: [
    RwButtonComponent,
    RwTextInputComponent,
    RwCheckboxComponent,
    RwSelectComponent,
    RwColorPickerComponent,
    AvatarComponent,
    AvatarEditorComponent,
    AsyncPipe,
    RenwuPageComponent,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  private checkUser = inject(CheckUserValidator);

  UserStatus = UserStatus;
  userService = inject(RwUserService);

  @ViewChild(AvatarEditorComponent)
  avatarEditor?: AvatarEditorComponent;
  toastService = inject(RwToastService);
  stateService = inject(StateService);
  dataService = inject(RwDataService);
  transloco = inject(TranslocoService);
  coreSettings = inject(RW_CORE_SETTINGS);
  currentUser: User;
  userForm = new FormGroup(
    {
      id: new FormControl(''),
      username: new FormControl('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl('', {
        validators: [Validators.minLength(2), Validators.email],
      }),
      full_name: new FormControl('', {
        validators: [Validators.minLength(2)],
      }),
      phone: new FormControl(''),
      initials_text: new FormControl(''),
      initials_color: new FormControl(''),
      holidays: new FormControl<HolidayCalendar>(null),
      type: new FormControl<UserType>(UserType.INTERNAL),
      status: new FormControl<UserStatus>(UserStatus.ACTIVE),
      is_admin: new FormControl<boolean>(false),
      settings: new FormGroup({
        time_zone_name: new FormControl(''),
        profile: new FormGroup({
          language: new FormControl<ProfileSettingsModel['language']>(
            AppLangs.EN,
          ),
          formats: new FormControl<ProfileSettingsModel['formats']>(
            AppDateFormat.EN_US,
          ),
        }),
      }),
    },
    {
      asyncValidators: [this.checkUser.validate.bind(this.checkUser)],
    },
  );
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

  private sourceUser = inject(ActivatedRoute).paramMap.pipe(
    map((p) => p.get('id')),
    switchMap((id) => this.dataService.getUser(id)),
    tap((user) => {
      this.userForm.patchValue(user);
      this.userForm.markAsPristine();
      this.currentUser = user;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  editedUser = this.sourceUser.pipe(
    switchMap((user) =>
      merge(of(null), this.userForm.valueChanges).pipe(
        map(
          () =>
            ({
              ...user,
              ...this.userForm.getRawValue(),
            }) as User,
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  async saveUser() {
    await this.avatarEditor?.applyDraft();
    await firstValueFrom(
      this.userService.saveUser(this.userForm.value.id, {
        ...this.currentUser,
        ...this.userForm.value,
        ...{
          settings: {
            ...this.currentUser.settings,
            time_zone_name: this.userForm.value.settings.time_zone_name,
            profile: {
              ...this.currentUser.settings.profile,
              language: this.userForm.value.settings.profile.language,
            },
          },
        },
      } as User),
    );
    this.stateService.setFromProfile(
      this.userService.getUser().settings.profile,
    );
    this.toastService.success(this.transloco.translate('settings.user-saved'));
  }
  async deleteUser() {
    await firstValueFrom(
      this.userService
        .deleteUser(this.userForm.value.id)
        .pipe(
          tap(() =>
            this.toastService.success(
              this.transloco.translate('settings.user-deleted'),
            ),
          ),
        ),
    );
    this.userForm.patchValue(
      await firstValueFrom(this.dataService.getUser(this.userForm.value.id)),
    );
  }
  async copyInviteLink() {
    const token = await firstValueFrom(
      this.dataService.getInviteToken(this.userForm.value.id),
    );
    const copied = copyToClipboard(
      `${this.coreSettings.siteInviteUrl}/?token=${token.invite_token}`,
    );
    if (copied) {
      this.toastService.success(
        this.transloco.translate('settings.invite-link-copied'),
      );
    }
  }
  async restore() {
    await firstValueFrom(this.dataService.restoreUser(this.userForm.value.id));
    this.userForm.patchValue(
      await firstValueFrom(this.dataService.getUser(this.userForm.value.id)),
    );
  }
}
