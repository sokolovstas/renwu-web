import { AsyncPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RwDurationToStringPipe } from '@renwu/components';
import { RwDataService } from '@renwu/core';
import { switchMap } from 'rxjs';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-backlog',
  standalone: true,
  imports: [JsonPipe, AsyncPipe, RwDurationToStringPipe],
  templateUrl: './backlog.component.html',
  styleUrl: './backlog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacklogComponent {
  backlog = this.projectService.currentProject.pipe(
    switchMap((c) => this.dataService.getBacklogStat(c.id)),
  );
  constructor(
    private dataService: RwDataService,
    private projectService: ProjectService,
  ) {}
}
