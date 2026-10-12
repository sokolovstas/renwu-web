import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwDatePipe, RwIconComponent, RwTooltipDirective } from '@renwu/components';
import { RwDataService, RwDocument, RwIssueService } from '@renwu/core';
import { Observable, catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-task-documents',
  standalone: true,
  imports: [AsyncPipe, RwDatePipe, RwIconComponent, RwTooltipDirective, TranslocoPipe],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDocumentsComponent {
  private readonly issueService = inject(RwIssueService);
  private readonly dataService = inject(RwDataService);

  private issueId$ = this.issueService.issue.pipe(
    map((issue) => issue?.id),
    distinctUntilChanged(),
  );

  documents$: Observable<RwDocument[] | null> = this.issueId$.pipe(
    switchMap((id): Observable<RwDocument[] | null> => {
      if (!id) {
        return of([]);
      }
      return this.dataService
        .docsListDocuments(String(id))
        .pipe(catchError(() => of(null)));
    }),
  );

  openDocument(doc: RwDocument): void {
    globalThis.open(`/document/${doc.id}`, '_blank', 'noopener,noreferrer');
  }
}

