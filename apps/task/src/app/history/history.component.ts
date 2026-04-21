import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  IssueChangeEvent,
  IssueHistoryItemComponent,
  RwDataService,
  RwIssueService,
} from '@renwu/core';
import { catchError, map, of, switchMap } from 'rxjs';

import { sortHistoryEventsNewestFirst } from './history.utils';

@Component({
  selector: 'renwu-task-history',
  standalone: true,
  imports: [AsyncPipe, IssueHistoryItemComponent, TranslocoPipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);

  isNewIssue = this.issueService.newIssue;

  events$ = this.issueService.issue.pipe(
    switchMap((issue) => {
      if (!issue?.id || issue.id === 'new') {
        return of([] as IssueChangeEvent[]);
      }
      return this.dataService.getIssueEvents(String(issue.id)).pipe(
        catchError(() => of([] as IssueChangeEvent[])),
        map((events) => sortHistoryEventsNewestFirst(events)),
      );
    }),
  );
}
