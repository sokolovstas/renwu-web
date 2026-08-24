import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwSidebarService } from '@renwu/app-ui';
import { RwButtonComponent } from '@renwu/components';
import { AvatarComponent, RwUserService } from '@renwu/core';
import { map } from 'rxjs';
import { ProfileUserService } from '../profile-user.service';

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
    RwButtonComponent,
  ],
  templateUrl: './view-main.component.html',
  styleUrl: './view-main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewMainComponent {
  private readonly profileProfileUserService = inject(ProfileUserService);
  private readonly userService = inject(RwUserService);
  private readonly router = inject(Router);
  private readonly sidebarService = inject(RwSidebarService);

  readonly user = this.profileProfileUserService.currentUser.asObservable();

  readonly isSelf = this.user.pipe(
    map((u) => !!u?.id && this.userService.getIsCurrent(u.id)),
  );

  close(): void {
    void this.router.navigate([{ outlets: { section: null } }]).then(() => {
      this.sidebarService.scrollToMain();
    });
  }
}
