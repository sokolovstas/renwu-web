import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwDatePipe,
  RwIconComponent,
} from '@renwu/components';
import {
  DashboardWidget,
  DashboardWidgetGroupBy,
  Issue,
  IssueCardComponent,
  IssueTableService,
  QueryBuilderComponent,
  RwDataService,
  RwSearchService,
} from '@renwu/core';
import {
  Observable,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import {
  DashboardIssueGroup,
  groupIssues,
} from '../dashboard-groups';
import { MY_WORK_QUERY } from '../dashboard.defaults';

@Component({
  selector: 'renwu-dashboard-widget',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    TranslocoPipe,
    RwButtonComponent,
    RwDatePipe,
    RwIconComponent,
    IssueCardComponent,
    QueryBuilderComponent,
  ],
  providers: [IssueTableService],
  templateUrl: './widget.component.html',
  styleUrl: './widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetComponent {
  private searchService = inject(RwSearchService);
  private dataService = inject(RwDataService);
  private issueTableService = inject(IssueTableService);
  private transloco = inject(TranslocoService);

  widget = input.required<DashboardWidget>();
  dragging = input(false);
  dropTarget = input(false);
  editable = input(true);

  changed = output<DashboardWidget>();
  removed = output<void>();
  issueClick = output<Issue>();
  dragHandleStart = output<DragEvent>();
  dragHandleEnd = output<void>();

  settingsOpen = signal(false);
  titleDraft = signal('');

  private widget$ = toObservable(this.widget);

  private issues$: Observable<Issue[]> = this.widget$.pipe(
    distinctUntilChanged(
      (a, b) => a.source === b.source && a.query === b.query,
    ),
    switchMap((widget) => this.loadIssues(widget)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  groups$: Observable<DashboardIssueGroup[]> = combineLatest([
    this.widget$,
    this.issues$,
  ]).pipe(map(([widget, issues]) => groupIssues(issues, widget.groupBy)));

  displayTitle = computed(() => {
    const widget = this.widget();
    if (widget.title?.trim()) {
      return widget.title.trim();
    }
    if (widget.titleKey) {
      return this.transloco.translate(`dashboard.${widget.titleKey}`);
    }
    return this.transloco.translate('dashboard.new-widget');
  });

  groupLabel(group: DashboardIssueGroup): string {
    switch (group.kind) {
      case 'overdue':
        return this.transloco.translate('dashboard.overdue');
      case 'today':
        return this.transloco.translate('dashboard.today');
      case 'week':
        return this.transloco.translate('dashboard.this-week');
      case 'undated':
        return this.transloco.translate('dashboard.no-date');
      default:
        return '';
    }
  }

  startEditTitle(): void {
    this.titleDraft.set(this.widget().title || this.displayTitle());
    this.settingsOpen.set(true);
  }

  commitTitle(value: string): void {
    const title = (value ?? '').trim();
    this.patch({
      title,
      titleKey: title ? undefined : this.widget().titleKey,
    });
  }

  onTitleEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  toggleSettings(): void {
    this.settingsOpen.update((open) => !open);
    if (this.settingsOpen()) {
      this.titleDraft.set(this.widget().title || this.displayTitle());
    }
  }

  patch(partial: Partial<DashboardWidget>): void {
    this.changed.emit({ ...this.widget(), ...partial });
  }

  onQueryChange(query: string): void {
    this.patch({ query: query ?? '' });
  }

  setGroupBy(groupBy: DashboardWidgetGroupBy): void {
    this.patch({ groupBy });
  }

  onDragHandleStart(event: DragEvent): void {
    this.dragHandleStart.emit(event);
  }

  private loadIssues(widget: DashboardWidget): Observable<Issue[]> {
    const source$ =
      widget.source === 'recent' || widget.source === 'watcher'
        ? this.dataService.getUserTasks(widget.source)
        : this.searchService
            .search(widget.query?.trim() || MY_WORK_QUERY, '')
            .pipe(map((result) => result.issues || []));
    return source$.pipe(
      this.issueTableService.getRefreshedList(),
      catchError(() => of([] as Issue[])),
    );
  }
}
