import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import { RwDatePipe, RwRangeComponent } from '@renwu/components';
import { RwContainerService } from '@renwu/core';
import { map, switchMap } from 'rxjs';
import { BacklogComponent } from '../backlog/backlog.component';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-summary',
  standalone: true,
  imports: [
    RenwuPageComponent,
    AsyncPipe,
    BacklogComponent,
    RwRangeComponent,
    FormsModule,
    RouterLink,
    TranslocoPipe,
    RwDatePipe,
    NgClass,
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  currentProject = this.projectService.currentProject;
  milestones = this.projectService.currentProject.pipe(
    switchMap((container) =>
      this.containerService.getMilestones(container.id, false),
    ),
    map((v) =>
      v
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((v) => ({
          ...v,
          isDue:
            new Date(v.date).getTime() - new Date(v.date_calc).getTime() > 0,
        })),
    ),
  );
  constructor(
    private containerService: RwContainerService,
    private projectService: ProjectService,
  ) {}
}
