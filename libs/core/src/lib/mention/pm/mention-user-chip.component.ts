import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../avatar/avatar.component';
import { User } from '../../user/user.model';
import { RwUserService } from '../../user/user.service';

@Component({
  selector: 'renwu-mention-user-chip',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <renwu-avatar class="chip-avatar" [user]="user" size="0.85rem" />
    <span class="chip-name">{{ displayName }}</span>
  `,
  styleUrl: './mention-user-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionUserChipComponent {
  private router = inject(Router);
  private userService = inject(RwUserService);

  @Input()
  set username(value: string) {
    this._username = value;
    this.user =
      this.userService.getUserByUsername(value) ||
      ({ username: value, full_name: value } as User);
  }
  get username(): string {
    return this._username;
  }
  private _username = '';

  user: User | null = null;

  @HostBinding('class.rw-mention-user-chip')
  hostClass = true;

  @HostBinding('attr.title')
  get title(): string {
    return this.username ? `@${this.username}` : '';
  }

  get displayName(): string {
    return this.user?.full_name || this.user?.username || this.username;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.username) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigate([
      { outlets: { section: ['user', this.username] } },
    ]);
  }
}
