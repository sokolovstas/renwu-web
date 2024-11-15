import { AsyncPipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
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
import { firstValueFrom, map, shareReplay, switchMap, tap } from 'rxjs';

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
    AsyncPipe,
    JsonPipe,
    RenwuPageComponent,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  UserStatus = UserStatus;
  workHours = { 0: false, 1: false, 2: false, 3: false };
  userService = inject(RwUserService);
  toastService = inject(RwToastService);
  stateService = inject(StateService);
  dataService = inject(RwDataService);
  transloco = inject(TranslocoService);
  coreSettings = inject(RW_CORE_SETTINGS);
  cd = inject(ChangeDetectorRef);
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
  editedUser = this.userForm.valueChanges.pipe(
    map((v) => v as User),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor(private checkUser: CheckUserValidator) {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((p) => p.get('id')),
        switchMap((p) => this.dataService.getUser(p)),
      )
      .subscribe((p) => {
        console.log('tap');
        this.userForm.patchValue(p);
        this.currentUser = p;
      });

    console.log('constr');
    this.editedUser.subscribe((u) => console.log(u));
    this.userForm.valueChanges.subscribe((u) => console.log(u));
  }
  async saveUser() {
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
