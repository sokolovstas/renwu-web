import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { addMonthsUtc, parseUtcLike, unixSeconds } from './date-helpers';
import { TimelineRulerComponent } from './ruler/timeline-ruler.component';
import { TimelineScaleComponent } from './scale/timeline-scale.component';
import {
  IssueGroup,
  ListOptions,
  Milestone,
  QueryBuilderComponent,
  RwSearchService,
  RwUserService,
  RwWebsocketService,
  RwShortcutService,
  TimelineService as CoreTimelineService,
  User,
  UserWorkload,
} from '@renwu/core';
import { TimelineSettingsService } from './services/timeline-settings.service';
import { TimelineTableItemComponent } from './table/timeline-table-item.component';
import { TimelineItemComponent } from './graph/timeline-item.component';
import { IssueTreeRoot, TimelineIssue, TimelineLink } from './models/timeline-issue.model';
import { TimelineDataService } from './services/timeline-data.service';
import { TimelineRoadmapComponent } from './roadmap/timeline-roadmap.component';
import { WorkloadUserComponent } from './workload/workload-user.component';
import { debounceTime, filter, forkJoin, map, of, switchMap } from 'rxjs';
import { TimelineStateService } from './services/timeline-state.service';
import { TimelineLinkComponent } from './graph/timeline-link.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

type SelectedMilestone = { id: string; offset: number; due: boolean } | null;

@Component({
  selector: 'renwu-timeline-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TimelineDataService,
    TimelineSettingsService,
    TimelineStateService,
    RwSearchService,
  ],
  imports: [
    QueryBuilderComponent,
    TranslocoPipe,
    TimelineScaleComponent,
    TimelineRulerComponent,
    TimelineTableItemComponent,
    TimelineItemComponent,
    TimelineLinkComponent,
    TimelineRoadmapComponent,
    WorkloadUserComponent,
  ],
})
export class TimelineComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(RwUserService);
  private readonly translocoService = inject(TranslocoService);
  private readonly searchService = inject(RwSearchService);
  private readonly websocketService = inject(RwWebsocketService);
  private readonly shortcutService = inject(RwShortcutService);
  private readonly settingsService = inject(TimelineSettingsService);
  private readonly dataService = inject(TimelineDataService);
  private readonly coreTimelineService = inject(CoreTimelineService);
  private readonly stateService = inject(TimelineStateService);

  private readonly currentUser = toSignal(this.userService.currentUser, {
    initialValue: this.userService.currentUserValue,
  });

  protected readonly isWorkload = computed(() => Boolean(this.currentUser()));

  protected readonly settings = computed(() =>
    this.settingsService.getTimeline(this.isWorkload()),
  );

  protected readonly dateStart = signal<Date>(new Date());
  protected readonly dateEnd = signal<Date>(addMonthsUtc(new Date(), 1));

  protected readonly selectedUsers = signal<User[]>([]);
  protected readonly queryString = signal('');
  protected readonly queryHash = signal('');
  protected readonly selectMilestone = signal<SelectedMilestone>(null);
  protected readonly linesOnly = signal(false);
  protected readonly rootChild = signal<IssueTreeRoot>({
    type: 'root',
    _SHOWCHILDS: true,
    childs: [],
  });
  protected readonly roadmapItems = signal<Milestone[]>([]);
  protected readonly loading = signal(false);
  protected readonly workload = signal<UserWorkload | null>(null);
  protected readonly links = signal<TimelineLink[]>([]);
  protected readonly scrollLeftGraph = signal(0);
  protected readonly scrollTopGraph = signal(0);
  private readonly activeContainerId = signal<string | null>(null);
  private readonly pendingReload = signal(false);
  private selectedIssueId: string | null = null;
  @ViewChild('graphScroll') private graphScroll?: ElementRef<HTMLDivElement>;

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map((qp) => ({
        containerKey: qp.get('container_key') || '',
        queryHash: qp.get('query_hash') || '',
      })),
    ),
    { initialValue: { containerKey: '', queryHash: '' } },
  );
  private readonly reloadCounter = signal(0);

  constructor() {
    // Load persisted settings once the current user is available.
    effect(() => {
      const userId = this.currentUser()?.id;
      this.settingsService.initFromLocalStorage(userId ?? undefined);
    });

    effect((onCleanup) => {
      const grouping = this.settings().grouping || 'none';
      const params = this.queryParams();
      const routeContainerKey = params.containerKey;
      const queryHash = this.queryHash() || params.queryHash;
      const user = this.currentUser();
      this.reloadCounter();
      this.loading.set(true);
      const sub = this.dataService
        .loadContainers()
        .pipe(
          map((containers) => {
            if (!containers?.length) return null;
            if (routeContainerKey) {
              return containers.find((c) => c.key === routeContainerKey) || containers[0];
            }
            return containers[0];
          }),
          switchMap((container) => {
            if (!container) {
              this.activeContainerId.set(null);
              return of({ groups: [] as IssueGroup[], milestones: [] as Milestone[] });
            }
            this.activeContainerId.set(container.id);
            if (!routeContainerKey && container.key) {
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { container_key: container.key },
                queryParamsHandling: 'merge',
              });
            }
            return forkJoin({
              groups: this.dataService.loadIssueTree(container.id, grouping, {
                queryHash,
              }),
              milestones: this.dataService.loadMilestones(container.id),
            });
          }),
        )
        .subscribe({
          next: ({ groups, milestones }: { groups: IssueGroup[]; milestones: Milestone[] }) => {
            this.rootChild.set({
              type: 'root',
              _SHOWCHILDS: true,
              childs: this.toTree(groups),
            });
            this.stateService.recalculateIndexes(this.rootChild());
            this.roadmapItems.set(milestones || []);
            const timezone = this.userService.getTimeZone(this.currentUser() ?? undefined) || 'UTC';
            const range = this.coreTimelineService.calcMinMaxDate(groups ?? [], timezone);
            this.links.set(
              this.dataService.parseLinksFromIssues(
                this.rootChild().childs,
                range.issuesMap,
              ) as unknown as TimelineLink[],
            );
            this.dateStart.set(range.dateStart);
            this.dateEnd.set(range.dateEnd);
            this.centerNow();
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      onCleanup(() => sub.unsubscribe());

      if (user?.id) {
        this.dataService
          .loadUserWorkload(user.id, {})
          .subscribe((value) => this.workload.set(value));
      }
    });

    this.websocketService.issue
      .pipe(
        debounceTime(1000),
        filter((event) => {
          const containerId = (event as { container?: string } | null)?.container;
          const activeContainerId = this.activeContainerId();
          return !activeContainerId || !containerId || containerId === activeContainerId;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.requestReload();
      });
    this.websocketService.workbot
      .pipe(
        filter((event) => (event as { type?: string } | null)?.type === 'end'),
        debounceTime(1000),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.requestReload();
      });

    const left = this.shortcutService.subscribe('ArrowLeft', () => {
      this.scrollLeftGraph.update((v) => Math.max(0, v - 100));
    });
    const right = this.shortcutService.subscribe('ArrowRight', () => {
      this.scrollLeftGraph.update((v) => v + 100);
    });
    this.destroyRef.onDestroy(() => {
      left?.unsubscribe();
      right?.unsubscribe();
    });

    effect(() => {
      if (!this.loading() && this.pendingReload()) {
        this.pendingReload.set(false);
        this.reloadCounter.update((v) => v + 1);
      }
    });

    // Keep local state in sync with route and resolve query string from hash.
    effect(() => {
      const routeHash = this.queryParams().queryHash;
      if (routeHash && routeHash !== this.queryHash()) {
        this.queryHash.set(routeHash);
        const options = new ListOptions();
        options.hash = routeHash;
        this.searchService.setListOptions(options);
      }
    });

    this.searchService.listOptions
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => {
        const nextHash = options?.hash || '';
        const nextQuery = options?.queryString || '';
        this.queryString.set(nextQuery);
        this.queryHash.set(nextHash);
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { query_hash: nextHash || null },
          queryParamsHandling: 'merge',
        });
        this.requestReload();
      });
  }

  protected onScaleChanged(): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const centerPx = this.scrollLeftGraph() + graphEl.clientWidth / 2;
    const centerUnix = unixSeconds(this.dateStart()) + centerPx * this.settings().oldScale;
    const nextLeft =
      (centerUnix - unixSeconds(this.dateStart())) / this.settings().scale -
      graphEl.clientWidth / 2;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nextLeft)));
  }

  protected onFitToScreen(): void {
    // Placeholder: later we will recompute dateStart/dateEnd from issues bounds.
    const now = new Date();
    this.dateStart.set(now);
    this.dateEnd.set(addMonthsUtc(now, 1));
  }

  protected onScrollTo(item: TimelineIssue): void {
    this.onSelected(item);
    this.centerAtIssue(item);
  }

  protected onSelected(item: TimelineIssue): void {
    if (!item?.id) return;
    if (this.selectedIssueId && this.selectedIssueId !== item.id) {
      this.stateService.setSelected(this.selectedIssueId, false);
    }
    this.selectedIssueId = item.id;
    this.stateService.setSelected(item.id, true);
  }

  protected currentUserValue(): User | null {
    return this.currentUser() ?? null;
  }

  protected onGraphScroll(event: Event): void {
    const target = event.target as HTMLDivElement | null;
    if (!target) return;
    this.scrollLeftGraph.set(target.scrollLeft);
    this.scrollTopGraph.set(target.scrollTop);
  }

  protected onQueryChanged(query: string): void {
    this.searchService.updateQuery(query || '');
  }

  private toTree(groups: IssueGroup[]): TimelineIssue[] {
    return (groups || []).map((g) => ({
      id: g.id,
      type: 'group',
      title: this.getGroupTitle(g),
      _SHOWCHILDS: true,
      childs: (g.issues || []) as TimelineIssue[],
    }));
  }

  private getGroupTitle(group: IssueGroup): string {
    const key = group.key as { title?: string; full_name?: string; name?: string } | null;
    return (
      key?.title ||
      key?.full_name ||
      key?.name ||
      this.translocoService.translate('timeline.groupFallback')
    );
  }

  private centerNow(): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const nowOffset =
      (unixSeconds(new Date()) - unixSeconds(this.dateStart())) /
      this.settings().scale;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nowOffset - graphEl.clientWidth / 2)));
  }

  private centerAtIssue(issue: TimelineIssue): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const baseDate = issue.date_start_calc || issue.date_start;
    if (!baseDate) return;
    const centerDate = parseUtcLike(baseDate);
    if (!centerDate) return;
    const centerUnix = unixSeconds(centerDate);
    const nextLeft =
      (centerUnix - unixSeconds(this.dateStart())) / this.settings().scale -
      graphEl.clientWidth / 2;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nextLeft)));
  }

  private requestReload(): void {
    if (this.loading()) {
      this.pendingReload.set(true);
      return;
    }
    this.reloadCounter.update((v) => v + 1);
  }
}

