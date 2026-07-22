import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AvatarComponent, RwUserService } from '@renwu/core';
import { map } from 'rxjs';
import { UserService } from '../user.service';

@Component({
  selector: 'renwu-profile-view-main',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    AvatarComponent,
  ],
  templateUrl: './view-main.component.html',
  styleUrl: './view-main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewMainComponent {
  private readonly profileUserService = inject(UserService);
  private readonly userService = inject(RwUserService);

  readonly user = this.profileUserService.currentUser.asObservable();

  readonly isSelf = this.user.pipe(
    map((u) => !!u?.id && this.userService.getIsCurrent(u.id)),
  );
}
