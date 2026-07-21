import { AsyncPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ISelectItem,
  RwButtonComponent,
  RwSelectComponent,
  SelectModelBase,
} from '@renwu/components';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  BoardGroup,
  BoardGroupComponent,
  BoardGroupsCardType,
  BoardGroupsCardView,
  BoardGroupsConfig,
  BoardGroupsConfigOverride,
  BoardSettings,
  BoardSettingsComponent,
  RwBoardService,
  RwGroupService,
} from '@renwu/board';
import {
  BoardBucketsResponse,
  Issue,
  ListOptions,
  QueryBuilderComponent,
  RwDataService,
  RwContainerService,
  RwSearchService,
  RwUserService,
  RwWebsocketService,
} from '@renwu/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  filter,
  map,
  merge,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

/** Board UI selection flag (legacy pattern; not persisted on the server). */
type IssueBoardUi = Issue & { __is_selected?: boolean };

@Component({
  selector: 'renwu-boards-board',
  standalone: true,
  imports: [
    BoardGroupComponent,
    BoardSettingsComponent,
    AsyncPipe,
    QueryBuilderComponent,
    RwButtonComponent,
    RwSelectComponent,
    TranslocoPipe,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cd = inject(ChangeDetectorRef);

  readonly boardService = inject(RwBoardService);
  readonly groupService = inject(RwGroupService);
  private readonly dataService = inject(RwDataService);
  private readonly searchService = inject(RwSearchService);
  private readonly containerService = inject(RwContainerService);
  private readonly websocketService = inject(RwWebsocketService);
  private readonly sidebarService = inject(RenwuSidebarService);
  private readonly userService = inject(RwUserService);

  private readonly refreshTasks$ = new Subject<void>();
  private readonly latestContainerId = signal<string | null>(null);

  readonly showSettings = signal(false);

  readonly routeBoardId$ = this.route.paramMap.pipe(
    map((p) => p.get('id')),
    distinctUntilChanged(),
  );

  readonly board$ = this.routeBoardId$.pipe(
    switchMap((id) => this.boardService.getBoard(id)),
  );

  /** Live config while board settings are edited; otherwise null. */
  readonly previewBoard$ = new BehaviorSubject<BoardGroupsConfig | null>(null);
  readonly viewOverride$ = new BehaviorSubject<BoardGroupsConfigOverride>(
    new BoardGroupsConfigOverride(),
  );

  readonly selectedIssues = signal<IssueBoardUi[]>([]);
  readonly queryString$ = this.searchService.listOptions.pipe(
    map((o) => o.queryString || ''),
    distinctUntilChanged(),
  );

  readonly boardViewModel = this.createSingleModel(
    BoardSettings.issueViews.map((v) => ({ id: v.id, label: v.label })),
  );
  readonly boardTypeModel = this.createSingleModel(
    BoardSettings.cardType.map((t) => ({ id: t.id, label: t.label })),
  );

  /** Config shown in the settings panel (preview draft or server board). */
  readonly settingsBoard$ = combineLatest([this.board$, this.previewBoard$]).pipe(
    map(([b, p]) => p ?? b),
  );

  readonly listOptions$ = merge(
    this.searchService.listOptions,
    this.refreshTasks$.pipe(map(() => this.searchService.listOptions.getValue())),
  );

  readonly effectiveBoard$ = combineLatest([
    this.board$,
    this.previewBoard$,
    this.viewOverride$,
  ]).pipe(
    map(([b, preview, override]) => {
      const config = (preview ?? b).clone();
      config.view = override.view ?? config.view;
      config.type = override.type ?? config.type;
      return config;
    }),
    tap((config) => this.syncStatusBarModels(config)),
  );

  readonly boardData$ = combineLatest([this.effectiveBoard$, this.listOptions$]).pipe(
    switchMap(([config, options]) => this.loadBoardData(config, options)),
    tap(() => this.selectedIssues.set([])),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly taskCount$ = this.boardData$.pipe(
    map((data) => data.issues.length),
    distinctUntilChanged(),
  );

  readonly rootGroup$ = combineLatest([
    this.boardData$,
    this.containerService.containers,
  ]).pipe(
    tap(([data, containers]) => {
      const issues = data.issues;
      const cid =
        issues.find((i) => i.container?.id)?.container?.id ??
        containers[0]?.id ??
        null;
      this.latestContainerId.set(cid);
    }),
    switchMap(([data, containers]) => {
      const issues = data.issues;
      const config = data.config;
      const cid =
        issues.find((i) => i.container?.id)?.container?.id ??
        containers[0]?.id ??
        null;
      if (!config) {
        return of(null);
      }
      if (cid) {
        return this.groupService.loadDictionaries(cid).pipe(
          switchMap(() =>
            this.groupService.group(issues, config, data.buckets),
          ),
        );
      }
      return this.groupService.group(issues, config, data.buckets);
    }),
  );

  private readonly groupCmps = viewChildren(BoardGroupComponent);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const queryHash = params.get('query_hash');
        if (queryHash) {
          const options = new ListOptions();
          options.hash = queryHash;
          this.searchService.setListOptions(options);
          return;
        }
        this.searchService.setListOptions(new ListOptions('closed="false"'));
      });

    this.websocketService.issue
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(
          (event) =>
            !this.latestContainerId() ||
            (event.container != null &&
              event.container === this.latestContainerId()),
        ),
        debounceTime(1000),
      )
      .subscribe(() => {
        this.refreshTasks$.next();
      });
  }

  private loadBoardData(config: BoardGroupsConfig, options: ListOptions) {
    if (!config) {
      return of({
        config,
        issues: [] as Issue[],
        buckets: null as BoardBucketsResponse | null,
      });
    }

    if (this.shouldUseBoardBuckets(config)) {
      return this.dataService
        .getBoardBuckets({
          query: options.hash ? '' : options.queryString || 'closed="false"',
          query_hash: options.hash || undefined,
          columns: config.groups[0].statusColumns.map((column) => ({
            id: column.id,
            query: column.query || '',
          })),
          page_size: 99999,
        })
        .pipe(
          map((buckets) => ({
            config,
            issues: buckets.issues ?? [],
            buckets,
          })),
        );
    }

    return this.searchService
      .search(options.queryString || 'closed="false"', '', options.hash)
      .pipe(
        map((tasks) => ({
          config,
          issues: tasks.issues ?? [],
          buckets: null as BoardBucketsResponse | null,
        })),
      );
  }

  private shouldUseBoardBuckets(config: BoardGroupsConfig): boolean {
    const firstGroup = config.groups?.[0];
    return (
      firstGroup?.field?.id === 'status-buckets' &&
      Boolean(firstGroup.statusColumns?.length)
    );
  }

  toggleSettings(): void {
    const next = !this.showSettings();
    this.showSettings.set(next);
    if (!next) {
      this.previewBoard$.next(null);
    }
    this.cd.markForCheck();
  }

  resetDisplayOverride(): void {
    this.viewOverride$.next(new BoardGroupsConfigOverride());
  }

  onSettingsUpdateGrouping(cfg: BoardGroupsConfig): void {
    this.previewBoard$.next(cfg);
    this.cd.markForCheck();
  }

  onReloadBoards(): void {
    this.previewBoard$.next(null);
    this.showSettings.set(false);
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  onSelected(event: {
    group: BoardGroup;
    issue: IssueBoardUi;
    all?: boolean;
  }): void {
    if (event.all) {
      const group = event.group;
      if (group) {
        const initial = event.issue.__is_selected;
        for (const issue of group.items) {
          this.setSelection(issue as IssueBoardUi, !initial);
        }
      }
    } else {
      const issue = event.issue as IssueBoardUi;
      this.setSelection(issue, !issue.__is_selected);
    }
    this.markGroupTreeForCheck();
  }

  onBoardViewOverrideChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const view = BoardSettings.issueViews.find((v) => v.id === id);
    this.patchDisplayOverride({ view });
  }

  onBoardTypeOverrideChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const type = BoardSettings.cardType.find((t) => t.id === id);
    this.patchDisplayOverride({ type });
  }

  updateQuery(value: string): void {
    this.searchService.updateQuery(value || 'closed="false"');
    const hash = this.searchService.listOptions.getValue().hash;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: hash ? { query_hash: hash } : {},
      replaceUrl: true,
    });
  }

  applyQuickFilter(filter: 'open' | 'my' | 'unassigned' | 'all'): void {
    if (filter === 'all') {
      this.updateQuery('');
      return;
    }
    if (filter === 'my') {
      const username = this.userService.getUsername();
      this.updateQuery(
        username ? `closed="false" and assignee="${username}"` : 'closed="false"',
      );
      return;
    }
    if (filter === 'unassigned') {
      this.updateQuery('closed="false" and assignee=""');
      return;
    }
    this.updateQuery('closed="false"');
  }

  onAddTask(group: BoardGroup): void {
    let issue: Issue = Object.assign({ id: 'new' }, group.issue) as Issue;
    let g: BoardGroup = group;
    while (g.parent) {
      g = g.parent;
      issue = Object.assign({}, issue, g.issue) as Issue;
    }
    issue.assignes = issue.assignes_calc;
    if (
      issue.milestones &&
      issue.milestones[0] &&
      issue.milestones[0].id === 'null'
    ) {
      delete issue.milestones;
    }
    void this.router.navigate(
      [{ outlets: { section: ['task', issue.id ?? 'new'] } }],
      {
        state: { draftIssue: issue },
      },
    );
  }

  onOpenIssue(issue: Issue): void {
    this.sidebarService.currentTask.next(issue);
  }

  onIssueDropped(event: { issueId: string; targetGroup: BoardGroup }): void {
    const patch = this.getIssuePatchFromGroup(event.targetGroup);
    const selected = this.selectedIssues();
    const draggedSelected = selected.some((issue) => issue.id === event.issueId);
    const ids =
      draggedSelected && selected.length > 0
        ? new Set(selected.map((issue) => issue.id).filter((id) => !!id))
        : new Set(event.issueId ? [event.issueId] : []);
    const requests = Array.from(ids).map((id) =>
      this.dataService.saveIssue(id, patch),
    );
    if (requests.length === 0) {
      return;
    }
    forkJoin(requests).subscribe(() => {
      this.selectedIssues.set([]);
      this.refreshTasks$.next();
    });
  }

  private setSelection(issue: IssueBoardUi, value: boolean): void {
    issue.__is_selected = value;
    this.selectedIssues.update((selected) => {
      if (value) {
        return selected.includes(issue) ? selected : [...selected, issue];
      }
      return selected.filter((i) => i !== issue);
    });
    this.cd.markForCheck();
  }

  private markGroupTreeForCheck(): void {
    for (const g of this.groupCmps()) {
      g.markForCheck();
    }
  }

  private patchDisplayOverride(patch: {
    view?: BoardGroupsCardView;
    type?: BoardGroupsCardType;
  }): void {
    const next = {
      ...this.viewOverride$.getValue(),
      ...patch,
    } as BoardGroupsConfigOverride;
    this.viewOverride$.next(next);
  }

  private syncStatusBarModels(config: BoardGroupsConfig): void {
    void this.boardViewModel.setData(config.view?.id);
    void this.boardTypeModel.setData(config.type?.id);
  }

  private createSingleModel(
    staticData: ISelectItem<string>[],
  ): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.staticData = staticData;
    return model;
  }

  private getIssuePatchFromGroup(group: BoardGroup): Issue {
    let patch = Object.assign({}, group.issue) as Issue;
    let current = group;
    while (current.parent) {
      current = current.parent;
      patch = Object.assign({}, patch, current.issue) as Issue;
    }
    if (
      patch.milestones &&
      patch.milestones[0] &&
      patch.milestones[0].id === 'null'
    ) {
      patch.milestones = [];
    }
    return patch;
  }
}
