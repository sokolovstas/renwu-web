import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RwIconComponent, RwTooltipDirective } from '@renwu/components';
import { Color, lettersWithEmoji } from '@renwu/utils';
import { User } from '../user/user.model';
import { RwUserService } from '../user/user.service';

@Component({
  selector: 'renwu-avatar',
  standalone: true,
  imports: [RwTooltipDirective, RwIconComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnInit, OnDestroy {
  destroy = inject(DestroyRef);

  @Input()
  set user(value: User | null) {
    this.__user = value;
    this.update();
  }
  get user(): User | null {
    return this.__user;
  }
  __user: User | null;

  @Input()
  set userId(value: string) {
    this.__user = this.userService.getUser(value);
    this.update();
  }

  @Input()
  showOnline = true;

  @Input()
  showTooltip = true;

  @Input()
  set size(value: string) {
    this._size = value;
    this.update();
  }
  get size(): string {
    return this._size;
  }
  _size = '30px';

  @Input()
  newUser: boolean;

  fontSize = '13px';

  error: boolean;

  avatarUrl: string;
  @Input()
  initials = '-';
  online: boolean;
  @Input()
  color = '#eee';
  name: string;

  textColor = 'var(--always-black)';

  constructor(
    public userService: RwUserService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userService.userList
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.update();
      });
    this.userService.onlineMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.online = this.getOnline();
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.user = null;
  }

  update(): void {
    if (!this.user?.id && this.user?.username) {
      const user = this.userService.getUserByUsername(this.user.username);
      if (user) {
        this.user.id = user.id;
      }
    }
    this.avatarUrl = this.getUrl();
    this.initials = this.getInitials();
    this.color = this.getColor();
    this.textColor = new Color(this.color).getTextColor(
      'var(--always-white)',
      'var(--always-black)',
    );
    this.name = this.getName();

    if (this.size && this.initials) {
      const textLength = lettersWithEmoji(this.initials).length;
      this.fontSize = `${
        (parseFloat(this.size) / textLength) * 0.75
      }${this.size.substr((parseFloat(this.size).toString() + '').length)}`;
    }

    this.cd.markForCheck();
  }

  getUrl(): string {
    if (!this.newUser && this.user && this.user.id) {
      return this.userService.getAvatar(this.user.id);
    }
    return undefined;
  }

  getInitials(): string {
    if (this.user && this.user.id) {
      return this.userService.getInitials(this.user);
    }
    return this.initials;
  }

  getOnline(): boolean {
    if (this.user && this.user.id) {
      return this.userService.getIsOnline(this.user.id);
    }
    return false;
  }

  getColor(): string {
    if (this.user && this.user.id) {
      return this.userService.getInitialsColor(this.user);
    }
    return this.color;
  }
  getName(): string {
    if (this.user && this.user.id) {
      let fullName = this.userService.getFullName(this.user);
      fullName = fullName.replace(' ', '&nbsp;');
      return `${fullName} (${this.userService.getUsername(this.user)})`;
    } else {
      return '';
    }
  }
}
