import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  IssueChilds,
  IssueHrefComponent,
  RwDataService,
  RwIssueService,
} from '@renwu/core';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-task-sub-task',
  standalone: true,
  imports: [AsyncPipe, TranslocoPipe, IssueHrefComponent],
  templateUrl: './sub-task.component.html',
  styleUrl: './sub-task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubTaskComponent {
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);

  private readonly emptyChilds: IssueChilds = {
    childs: [],
    childs_completed_total: 0,
    childs_estimated_total: 0,
    childs_resolved: 0,
    childs_total: 0,
  };

  childData$ = this.issueService.issue.pipe(
    switchMap((issue) => {
      if (!issue?.id || issue.id === 'new') {
        return of(this.emptyChilds);
      }
      return this.dataService.getChildIssues(String(issue.id)).pipe(
        catchError(() => of(this.emptyChilds)),
      );
    }),
  );

  isNewIssue = this.issueService.newIssue;

  hasProgress(data: IssueChilds): boolean {
    return (data.childs_total ?? 0) > 0;
  }
}
