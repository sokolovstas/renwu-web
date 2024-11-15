import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RenwuPageWithSidebarComponent,
  RenwuSidebarService,
} from '@renwu/app-ui';
import { RwButtonComponent } from '@renwu/components';
import { RwDataService } from '@renwu/core';

@Component({
  selector: 'renwu-tasks-main',
  standalone: true,
  imports: [
    RenwuPageWithSidebarComponent,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    RouterOutlet,
    RwButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  sidebarService = inject(RenwuSidebarService);
  dataService = inject(RwDataService);
  router = inject(Router);
  queries = this.dataService.getSearchQueries();
  addTask() {
    this.sidebarService.currentTask.next({ key: 'new' });
  }
  filterClick() {
    this.sidebarService.scrollToMain();
  }
}
