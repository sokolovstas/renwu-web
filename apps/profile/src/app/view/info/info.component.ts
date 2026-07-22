import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserService } from '../../user.service';

@Component({
  selector: 'renwu-profile-view-info',
  standalone: true,
  imports: [AsyncPipe, TranslocoPipe],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewInfoComponent {
  private readonly profileUserService = inject(UserService);

  readonly user = this.profileUserService.currentUser.asObservable();

  timezoneName(user: {
    settings?: { time_zone_name?: string };
  } | null): string {
    return user?.settings?.time_zone_name || '—';
  }
}
