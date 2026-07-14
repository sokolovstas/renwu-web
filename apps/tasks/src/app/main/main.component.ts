import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RenwuPageWithSidebarComponent,
  RenwuSidebarService,
} from '@renwu/app-ui';
import { RwSearchService } from '@renwu/core';

@Component({
  selector: 'renwu-tasks-main',
  standalone: true,
  imports: [
    RenwuPageWithSidebarComponent,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    RouterOutlet,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  sidebarService = inject(RenwuSidebarService);
  searchService = inject(RwSearchService);
  queries = this.searchService.savedQueries;

  filterClick() {
    this.sidebarService.scrollToMain();
  }
}
