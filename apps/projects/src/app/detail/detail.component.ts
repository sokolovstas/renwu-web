import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwPageWithSidebarComponent,
  RwSidebarService,
  RwTourAnchorDirective,
} from '@renwu/app-ui';

import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-detail',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    RwPageWithSidebarComponent,
    RwTourAnchorDirective,
    TranslocoPipe,
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent {
  private projectService = inject(ProjectService);

  project = this.projectService.currentProject;
  sidebarService = inject(RwSidebarService);

  sidebarClick() {
    this.sidebarService.scrollToMain();
  }
}
