import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalHeaderDirective,
  RwModalService,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import {
  CheckUserValidator,
  RwSettingsService,
  RwUserService,
  User,
  UserType,
} from '@renwu/core';
import { JSONUtils } from '@renwu/utils';

@Component({
  selector: 'renwu-settings-add-user',
  standalone: true,
  imports: [
    RwModalComponent,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwModalHeaderDirective,
    RwTextInputComponent,
    RwButtonComponent,
    RwSelectComponent,
    ReactiveFormsModule,
    AsyncPipe,
    TranslocoPipe
],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUserComponent implements AfterViewInit, OnDestroy {
  @Input()
  set user(value: User) {
    if (value.id) {
      this._user = JSONUtils.jsonClone(value);
      if (this._user.type === 'dummy') {
        this._user.type = UserType.INTERNAL;
        this._user.email = this._user.email || '';
      }
    } else {
      this._user = value;
    }
    this.userForm.patchValue(value);
  }
  get user(): User {
    return this._user;
  }
  _user: User;
  @Output()
  closed = new EventEmitter<void>();
  @Output()
  add = new EventEmitter<User>();

  userForm = new FormGroup(
    {
      id: new FormControl(''),
      username: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.minLength(2), Validators.email],
      }),
      full_name: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.minLength(2)],
      }),
      type: new FormControl<UserType>(null),
    },
    {
      asyncValidators: [this.checkUser.validate.bind(this.checkUser)],
    },
  );

  @ViewChild('username', { static: false })
  usernameTextinput: RwTextInputComponent;
  @ViewChild('email', { static: false }) emailTextinput: RwTextInputComponent;

  constructor(
    private userService: RwUserService,
    private toastService: RwToastService,
    private cd: ChangeDetectorRef,
    private checkUser: CheckUserValidator,
    private modalService: RwModalService,
    private settingsService: RwSettingsService,
  ) {}

  ngAfterViewInit() {
    const focusElement = this.usernameTextinput || this.emailTextinput;
    if (focusElement) {
      focusElement.setFocus();
    }
  }
  ngOnDestroy() {
    this.closed.next();
  }
  addUserAndInvite() {
    const user: User = this.userForm.value;
    if (!user.type) {
      user.type = UserType.INTERNAL;
    }
    this.userService.addUserAndInvite(user).subscribe({
      next: (data) => {
        this.toastService.success('User invited successfully');
        this.add.next(data);
        this.closeModal();
      },
      error: () => {
        this.toastService.error('Error when sending invite');
      },
    });
  }
  addUser() {
    const user: User = this.userForm.value;
    if (!user.type) {
      user.type = UserType.DUMMY;
    }
    user.email = null;
    user.settings = this.settingsService.getDefaultSettings();

    this.userService.addUser(user).subscribe({
      next: (data) => {
        this.toastService.success('User added successfully');
        this.add.next(data);
        this.closeModal();
      },
      error: () => {
        this.toastService.error('Error when adding a user');
      },
    });
  }
  inviteUser() {
    const user: User = this.userForm.value;
    this.userService.inviteUser(user).subscribe({
      next: () => {
        this.toastService.success('User invited successfully');
        this.closeModal();
      },
      error: () => {
        this.toastService.error('Error when sending invited');
      },
    });
  }
  closeModal() {
    this.modalService.close();
  }
}
