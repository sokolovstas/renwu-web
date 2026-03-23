
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuPageWithSidebarComponent } from '@renwu/app-ui';

import { RW_CORE_SETTINGS } from '@renwu/core';

@Component({
  selector: 'renwu-settings-settings',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RenwuPageWithSidebarComponent,
    RouterLinkActive,
    TranslocoPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  billingLink = inject(RW_CORE_SETTINGS).siteBillingUrl;
}
