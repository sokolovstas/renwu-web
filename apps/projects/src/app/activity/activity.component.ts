import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import { IssueHistoryItemComponent } from '@renwu/core';
import {
  DestinationType,
  MessageDestination,
  RwMessageService,
} from '@renwu/messaging';
import { map, switchMap } from 'rxjs';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-activity',
  standalone: true,
  imports: [
    IssueHistoryItemComponent,
    AsyncPipe,
    RenwuPageComponent,
    TranslocoPipe,
  ],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityComponent {
  private messageService = inject(RwMessageService);
  private projectService = inject(ProjectService);
  private cd = inject(ChangeDetectorRef);

  currentProject = this.projectService.currentProject;
  history = this.projectService.currentProject.pipe(
    switchMap((c) => {
      this.destination = this.messageService.getOrCreateDestination(
        {
          destination: {
            id: c.id,
            type: DestinationType.CONTAINER,
          },
        },
        { reversed: true },
      );
      this.destination.show(100);
      return this.destination.messages;
    }),
    map((messages) => {
      return messages.map((m) => m.newsData);
    }),
  );

  destination: MessageDestination;

  loading: boolean;
  loadMore() {
    this.loading = true;
    this.cd.markForCheck();
    this.destination.loadPrev(50).subscribe(() => {
      this.loading = false;
      this.cd.markForCheck();
    });
  }
}
