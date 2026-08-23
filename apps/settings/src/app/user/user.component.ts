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
import { RwPageComponent } from '@renwu/app-ui';
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
    RwPageComponent,
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

  /** Hour keys "0".."23" for work_hours toggles. */
  readonly workHourKeys = Array.from({ length: 24 }, (_, hour) => String(hour));

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
      jira_email: new FormControl('', { nonNullable: true }),
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
      work_hours: new FormGroup(
        Object.fromEntries(
          this.workHourKeys.map((hour) => [
            hour,
            new FormControl(false, { nonNullable: true }),
          ]),
        ),
      ),
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
      this.applyUser(user);
      void this.loadJiraEmail(user.id);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  editedUser = this.sourceUser.pipe(
    switchMap((user) =>
      merge(of(null), this.userForm.valueChanges).pipe(
        map(() => {
          const { jira_email: _jiraEmail, ...form } =
            this.userForm.getRawValue();
          return {
            ...user,
            ...form,
            work_hours: this.serializeWorkHours(),
          } as User;
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  async saveUser() {
    await this.avatarEditor?.applyDraft();
    const userId = this.userForm.value.id;
    const { jira_email, ...userFields } = this.userForm.getRawValue();
    await firstValueFrom(
      this.userService.saveUser(userId, {
        ...this.currentUser,
        ...userFields,
        work_hours: this.serializeWorkHours(),
        ...{
          settings: {
            ...this.currentUser.settings,
            time_zone_name: userFields.settings.time_zone_name,
            profile: {
              ...this.currentUser.settings.profile,
              language: userFields.settings.profile.language,
            },
          },
        },
      } as User),
    );
    await firstValueFrom(
      this.dataService.jiraSaveUserEmail(userId, {
        jira_email: jira_email || '',
      }),
    );
    this.stateService.setFromProfile(
      this.userService.getUser().settings.profile,
    );
    this.toastService.success(this.transloco.translate('settings.user-saved'));
  }

  private async loadJiraEmail(userId: string): Promise<void> {
    if (!userId) {
      return;
    }
    try {
      const link = await firstValueFrom(
        this.dataService.jiraGetUserEmail(userId),
      );
      this.userForm.controls.jira_email.setValue(link?.jira_email || '', {
        emitEvent: false,
      });
    } catch {
      this.userForm.controls.jira_email.setValue('', { emitEvent: false });
    }
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
    this.applyUser(
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
    this.applyUser(
      await firstValueFrom(this.dataService.getUser(this.userForm.value.id)),
    );
  }

  toggleWorkHour(hour: string): void {
    const control = this.userForm.controls.work_hours.get(hour);
    if (!control) {
      return;
    }
    control.setValue(!control.value);
    control.markAsDirty();
  }

  private applyUser(user: User): void {
    const { work_hours, ...rest } = user;
    this.userForm.patchValue(rest);
    this.patchWorkHours(work_hours);
    this.userForm.markAsPristine();
    this.currentUser = user;
  }

  private patchWorkHours(workHours?: User['work_hours']): void {
    const patch: Record<string, boolean> = {};
    for (const hour of this.workHourKeys) {
      patch[hour] = !!workHours?.[hour];
    }
    this.userForm.controls.work_hours.patchValue(patch);
  }

  private serializeWorkHours(): User['work_hours'] {
    const result: NonNullable<User['work_hours']> = {};
    const value = this.userForm.controls.work_hours.getRawValue() as Record<
      string,
      boolean
    >;
    for (const [hour, enabled] of Object.entries(value)) {
      if (enabled) {
        result[hour] = {};
      }
    }
    return result;
  }
}
