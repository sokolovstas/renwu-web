import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageWithSidebarComponent } from '@renwu/app-ui';

@Component({
  selector: 'renwu-profile-main',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RenwuPageWithSidebarComponent,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {}
