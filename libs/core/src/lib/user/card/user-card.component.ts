import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../avatar/avatar.component';
import { User } from '../user.model';
import { RwUserService } from '../user.service';

/**
 * Shared mini user profile (avatar + name/username/email).
 * Also used as a rich tooltip (`asTooltip`) via `RwTooltipDirective`.
 */
@Component({
  selector: 'renwu-user-card',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  private readonly cd = inject(ChangeDetectorRef);
  private readonly userService = inject(RwUserService);
  private readonly router = inject(Router);

  private _user: User | null = null;
  private _asTooltip = false;
  private _openOnClick = true;

  @Input()
  set user(value: User | null) {
    this._user = value;
    this.cd.markForCheck();
  }
  get user(): User | null {
    return this._user;
  }

  /** When true, host is positioned for floating-ui tooltips. */
  @Input()
  set asTooltip(value: boolean) {
    this._asTooltip = !!value;
    this.cd.markForCheck();
  }
  get asTooltip(): boolean {
    return this._asTooltip;
  }

  /** When false, card is display-only (no section navigation). */
  @Input()
  set openOnClick(value: boolean) {
    this._openOnClick = value !== false;
    this.cd.markForCheck();
  }
  get openOnClick(): boolean {
    return this._openOnClick;
  }

  @HostBinding('class')
  get hostClass(): string {
    return [
      'renwu-user-card',
      this._asTooltip ? 'renwu-user-card--tooltip' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get displayName(): string {
    if (!this._user) return '';
    return (
      this.userService.getFullName(this._user) ||
      this.userService.getUsername(this._user) ||
      ''
    );
  }

  get username(): string {
    if (!this._user) return '';
    return this.userService.getUsername(this._user) || '';
  }

  get showUsername(): boolean {
    const name = this.displayName;
    const username = this.username;
    return !!username && name !== username;
  }

  @HostBinding('style.cursor')
  get cursor(): string {
    return this._openOnClick && this.username ? 'pointer' : 'default';
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this._openOnClick) return;
    const username = this.username;
    if (!username) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigate([{ outlets: { section: ['user', username] } }]);
  }
}
