import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageWithSidebarComponent } from '@renwu/app-ui';
import { RwButtonComponent, RwIconComponent } from '@renwu/components';
import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'renwu-dashboard-shell',
  standalone: true,
  imports: [
    RwPageWithSidebarComponent,
    RouterLink,
    RouterOutlet,
    TranslocoPipe,
    RwButtonComponent,
    RwIconComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  constructor() {
    this.dashboardService.loadAll().pipe(takeUntilDestroyed()).subscribe();
  }

  createDashboard(): void {
    this.dashboardService.create().subscribe((created) => {
      if (created.id) {
        void this.router.navigate(['/dashboard', created.id]);
      }
    });
  }
}
