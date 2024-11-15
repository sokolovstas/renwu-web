import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RenwuPageWithSidebarComponent,
  RenwuSidebarService,
  RenwuTourAnchorDirective,
} from '@renwu/app-ui';
import { RwButtonComponent, RwIconComponent } from '@renwu/components';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-detail',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    RenwuPageWithSidebarComponent,
    RwIconComponent,
    RwButtonComponent,
    RenwuTourAnchorDirective,
    TranslocoPipe,
  ],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent {
  project = this.projectService.currentProject;
  sidebarService = inject(RenwuSidebarService);

  constructor(private projectService: ProjectService) {}

  sidebarClick() {
    this.sidebarService.scrollToMain();
  }
}
