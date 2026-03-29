import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  Renderer2,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { addMonthsUtc, parseUtcLike, unixSeconds } from './date-helpers';
import { unixSecondsVirtual } from './virtual-hours';
import { TimelineRulerComponent } from './ruler/timeline-ruler.component';
import { TimelineScaleComponent } from './scale/timeline-scale.component';
import {
  IssueGroup,
  ListOptions,
  Milestone,
  QueryBuilderComponent,
  RwDataService,
  RwSearchService,
  RwUserService,
  RwWebsocketService,
  RwShortcutService,
  TimelineService as CoreTimelineService,
  RwIssueDateTimeService,
  User,
  UserWorkload,
} from '@renwu/core';
import { TimelineSettingsService } from './services/timeline-settings.service';
import { TimelineTableItemComponent } from './table/timeline-table-item.component';
import { TimelineItemComponent } from './graph/timeline-item.component';
import { IssueTreeRoot, TimelineIssue, TimelineLink } from './models/timeline-issue.model';
import {
  countVisibleTimelineRows,
  flattenVisibleTimelinePreorder,
} from './row-striping';
import { TimelineDataService } from './services/timeline-data.service';
import { TimelineRoadmapComponent } from './roadmap/timeline-roadmap.component';
import {
  milestoneBarGeometry,
  milestoneSelectPayload,
} from './roadmap/milestone-select-helpers';
import { WorkloadUserComponent } from './workload/workload-user.component';
import { TimelineHolderDirective } from './shared/directives/timeline-holder.directive';
import { debounceTime, filter, forkJoin, map, of, switchMap } from 'rxjs';
import { TimelineStateService } from './services/timeline-state.service';
import { TimelineLinkComponent } from './graph/timeline-link.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

type SelectedMilestone = { id: string; offset: number; due: boolean } | null;

/** Matches `.timeline-link` (margin-top + height) in `timeline-link.component.scss`. */
const TIMELINE_LINK_ROW_PX = 6;

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
    TimelineScaleComponent,
    TimelineRulerComponent,
    TimelineTableItemComponent,
    TimelineItemComponent,
    TimelineLinkComponent,
    TimelineRoadmapComponent,
    WorkloadUserComponent,
    TimelineHolderDirective,
  ],
})
export class TimelineComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(RwUserService);
  private readonly translocoService = inject(TranslocoService);
  private readonly searchService = inject(RwSearchService);
  private readonly rwDataService = inject(RwDataService);
  private readonly websocketService = inject(RwWebsocketService);
  private readonly shortcutService = inject(RwShortcutService);
  private readonly settingsService = inject(TimelineSettingsService);
  private readonly dataService = inject(TimelineDataService);
  private readonly coreTimelineService = inject(CoreTimelineService);
  private readonly stateService = inject(TimelineStateService);
  private readonly renderer = inject(Renderer2);
  private readonly injector = inject(Injector);
  private readonly issueDateTimeSvc = inject(RwIssueDateTimeService);

  /** `true` = linear 24h calendar axis; `false` = compressed 8h workday mapping (see `IssueDateTime`). */
  protected readonly hours24InDay = signal(
    this.issueDateTimeSvc.issueDateTime.hours24InDay,
  );

  private readonly currentUser = toSignal(this.userService.currentUser, {
    initialValue: this.userService.currentUserValue,
  });

  protected readonly isWorkload = computed(() => Boolean(this.currentUser()));

  protected readonly timezone = computed(() => {
    return this.userService.getTimeZone(this.currentUser() ?? undefined) || 'UTC';
  });

  protected readonly settings = computed(() => this.settingsService.timelineSettings());

  protected readonly dateStart = signal<Date>(new Date());
  protected readonly dateEnd = signal<Date>(addMonthsUtc(new Date(), 1));
  protected readonly rulerLimit = computed(() => {
    const end = this.dateEnd();
    const scale = this.settings().scale;
    if (scale <= 2500) return addMonthsUtc(end, 6);
    if (scale <= 16500) return addMonthsUtc(end, 12);
    return addMonthsUtc(end, 24);
  });

  protected readonly gridLines = computed(() => {
    const start = this.dateStart();
    const end = this.rulerLimit();
    const scale = this.settings().scale;
    const h24 = this.hours24InDay();
    if (!start || !end || !scale) return [];
    const startU = unixSeconds(start);
    const endU = unixSeconds(end);
    if (endU <= startU) return [];
    const origin = unixSecondsVirtual(start, h24, '');
    const dayPx = 86400 / scale;
    const lines: number[] = [];
    if (dayPx >= 30) {
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      while (unixSeconds(cursor) < endU) {
        lines.push((unixSecondsVirtual(cursor, h24, '') - origin) / scale);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    } else if (dayPx >= 3) {
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const dow = cursor.getUTCDay();
      cursor.setUTCDate(cursor.getUTCDate() - ((dow + 6) % 7));
      while (unixSeconds(cursor) < endU) {
        lines.push((unixSecondsVirtual(cursor, h24, '') - origin) / scale);
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }
    } else {
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      while (unixSeconds(cursor) < endU) {
        lines.push((unixSecondsVirtual(cursor, h24, '') - origin) / scale);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }
    return lines;
  });

  /** Ticks once per minute so the "now" line position updates. */
  private readonly nowClock = signal(0);

  /** Horizontal px from `dateStart` to current time; `null` if now is outside [dateStart, rulerLimit]. */
  protected readonly nowLinePx = computed(() => {
    this.nowClock();
    const start = this.dateStart();
    const end = this.rulerLimit();
    const scale = this.settings().scale;
    const h24 = this.hours24InDay();
    if (!start || !end || !scale) return null;
    const now = new Date();
    const nowCal = unixSeconds(now);
    const startCal = unixSeconds(start);
    const endCal = unixSeconds(end);
    if (nowCal < startCal || nowCal > endCal) return null;
    const origin = unixSecondsVirtual(start, h24, '');
    const nowV = unixSecondsVirtual(now, h24, '');
    return (nowV - origin) / scale;
  });

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

  /** Same width as ruler / graph issue rows (virtual axis length in px). */
  protected readonly timelineTrackWidthPx = computed(() => {
    const start = this.dateStart();
    const end = this.rulerLimit();
    const scale = this.settings().scale;
    const h24 = this.hours24InDay();
    if (!start || !end || !scale) return 0;
    const o = unixSecondsVirtual(start, h24, '');
    const endV = unixSecondsVirtual(end, h24, '');
    return Math.max(0, (endV - o) / scale);
  });

  /** Total height of the sticky milestone strip (`milestones × milestoneRowHeightPx`). */
  protected readonly roadmapBandHeightPx = computed(() => {
    const s = this.settings();
    if (!s.showMilestones) return 0;
    return this.roadmapItems().length * s.milestoneRowHeightPx;
  });

  /**
   * Vertical dashed line at the milestone bar’s end (same px as roadmap), from the top of the graph
   * down to the bottom of the last visible row that references this milestone.
   */
  protected readonly milestoneEndMarkers = computed(() => {
    const s = this.settings();
    if (!s.showMilestones) return [];
    const milestones = this.roadmapItems();
    const roots = this.rootChild().childs;
    if (!milestones.length || !roots?.length) return [];

    const band = this.roadmapBandHeightPx();
    const linkBlock = this.links().length * TIMELINE_LINK_ROW_PX;
    const rowH = s.issueRowHeightPx;
    const dateStart = this.dateStart();
    const scale = s.scale;
    const h24 = this.hours24InDay();

    const flat = flattenVisibleTimelinePreorder(roots);
    const markers: Array<{
      id: string;
      leftPx: number;
      heightPx: number;
      due: boolean;
    }> = [];

    for (const m of milestones) {
      if (!m.id) continue;
      let lastIdx = -1;
      flat.forEach((node, idx) => {
        if (String(node.type) === 'group') return;
        const hit =
          node.milestones?.some((x) => x?.id === m.id) ||
          node.parent_milestones?.some((x) => x?.id === m.id);
        if (hit) lastIdx = idx;
      });
      if (lastIdx < 0) continue;

      const g = milestoneBarGeometry(m, dateStart, scale, h24);
      if (!g) continue;

      markers.push({
        id: m.id,
        leftPx: g.endPx,
        heightPx: band + linkBlock + (lastIdx + 1) * rowH,
        due: g.due,
      });
    }
    return markers;
  });

  protected readonly loading = signal(false);
  protected readonly workload = signal<UserWorkload | null>(null);
  protected readonly links = signal<TimelineLink[]>([]);
  protected readonly scrollLeftGraph = signal(0);
  protected readonly scrollTopGraph = signal(0);
  private readonly activeContainerId = signal<string | null>(null);
  private readonly pendingReload = signal(false);
  private selectedIssueId: string | null = null;
  /** Synced hover highlight between table and graph rows (issue id). */
  protected readonly hoveredIssueId = signal<string | null>(null);
  private dragTimeline = false;
  private scrollSource: 'graph' | 'table' | null = null;
  private resizeTableHandle: (() => void) | null = null;
  private resizeTableEndHandle: (() => void) | null = null;
  private prevTableScreenX = 0;
  @ViewChild('graphScroll') private graphScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('rulerWrapper') private rulerWrapper?: ElementRef<HTMLDivElement>;
  @ViewChild('tableBody') private tableBody?: ElementRef<HTMLDivElement>;
  @ViewChild('workloadBars') private workloadBars?: ElementRef<HTMLDivElement>;

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
    this.issueDateTimeSvc.issueDateTime.show24HoursInDay
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.hours24InDay.set(v));

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => Boolean(id)),
        switchMap((id) => this.rwDataService.getSearchQuery(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        if (!query?.id) return;
        const options = new ListOptions();
        options.hash = query.id;
        options.queryString = query.query_string;
        this.searchService.setListOptions(options);
      });

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
            const query = this.queryString();
            const treeFilters = {
              ...(query ? { query } : {}),
              ...(queryHash ? { query_hash: queryHash } : {}),
            };
            return forkJoin({
              groups: this.dataService.loadIssueTree(
                container.id,
                grouping,
                treeFilters,
              ),
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
            this.loading.set(false);
            afterNextRender(
              () => {
                requestAnimationFrame(() => this.centerNow());
              },
              { injector: this.injector },
            );
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

    effect(() => {
      const left = this.scrollLeftGraph();
      const top = this.scrollTopGraph();
      if (this.rulerWrapper?.nativeElement) {
        this.rulerWrapper.nativeElement.scrollLeft = left;
      }
      if (this.tableBody?.nativeElement) {
        this.tableBody.nativeElement.scrollTop = top;
      }
      if (this.workloadBars?.nativeElement) {
        this.workloadBars.nativeElement.scrollLeft = left;
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

    const nowLineInterval = setInterval(
      () => this.nowClock.update((n) => n + 1),
      60_000,
    );
    this.destroyRef.onDestroy(() => clearInterval(nowLineInterval));
  }

  protected onScaleChanged(): void {
    this.hours24InDay.set(this.issueDateTimeSvc.issueDateTime.hours24InDay);
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const h24 = this.hours24InDay();
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const centerPx = this.scrollLeftGraph() + graphEl.clientWidth / 2;
    const centerVirtual = startV + centerPx * this.settings().oldScale;
    const nextLeft =
      (centerVirtual - startV) / this.settings().scale - graphEl.clientWidth / 2;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nextLeft)));
  }

  protected onFitToScreen(): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const contentWidth = graphEl.clientWidth;
    if (!contentWidth) return;
    const idealScale =
      (unixSeconds(this.dateEnd()) - unixSeconds(this.dateStart())) / contentWidth;
    const ticks = this.settingsService.ticks;
    for (const tick of ticks) {
      if (!tick.scale) continue;
      if (idealScale > tick.min && idealScale <= tick.scale) {
        let pct = Math.round((tick.scale * 50) / idealScale);
        pct = Math.max(50, Math.min(200, pct));
        this.settingsService.setScaleTick(tick.id);
        this.settingsService.setScaleValue(pct);
        this.scrollLeftGraph.set(0);
        return;
      }
    }
    const lastTick = ticks[ticks.length - 1];
    if (lastTick) {
      this.settingsService.setScaleTick(lastTick.id);
      this.settingsService.setScaleValue(50);
      this.scrollLeftGraph.set(0);
    }
  }

  protected onScrollTo(item: TimelineIssue): void {
    this.onSelected(item);
    this.centerAtIssue(item);
  }

  protected onSelected(item: TimelineIssue & { __selected?: boolean }): void {
    const pulse = (item as { __selected?: boolean }).__selected;
    if (typeof pulse === 'boolean') {
      const id =
        item.id !== undefined && item.id !== null && String(item.id).length > 0
          ? String(item.id)
          : null;
      if (pulse && id) {
        this.hoveredIssueId.set(id);
      } else if (!pulse && id && this.hoveredIssueId() === id) {
        this.hoveredIssueId.set(null);
      }
      return;
    }

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

  protected onTableScroll(event: Event): void {
    if (this.scrollSource === 'graph') return;
    this.scrollSource = 'table';
    const target = event.target as HTMLDivElement | null;
    if (!target) return;
    this.scrollTopGraph.set(target.scrollTop);
    if (this.graphScroll?.nativeElement) {
      this.graphScroll.nativeElement.scrollTop = target.scrollTop;
    }
    requestAnimationFrame(() => (this.scrollSource = null));
  }

  protected onGraphScroll(event: Event): void {
    if (this.scrollSource === 'table') return;
    this.scrollSource = 'graph';
    const target = event.target as HTMLDivElement | null;
    if (!target) return;
    this.scrollLeftGraph.set(target.scrollLeft);
    this.scrollTopGraph.set(target.scrollTop);
    if (this.rulerWrapper?.nativeElement) {
      this.rulerWrapper.nativeElement.scrollLeft = target.scrollLeft;
    }
    if (this.tableBody?.nativeElement) {
      this.tableBody.nativeElement.scrollTop = target.scrollTop;
    }
    if (this.workloadBars?.nativeElement) {
      this.workloadBars.nativeElement.scrollLeft = target.scrollLeft;
    }
    requestAnimationFrame(() => (this.scrollSource = null));
  }

  protected onCenterNow(): void {
    this.centerNow();
  }

  protected onToggleWorkforce(): void {
    this.settingsService.setShowWorkforce(!this.settings().showWorkforce);
  }

  protected onMilestoneListClick(m: Milestone): void {
    const cur = this.selectMilestone();
    if (cur?.id === m.id) {
      this.selectMilestone.set(null);
      return;
    }
    const p = milestoneSelectPayload(
      m,
      this.dateStart(),
      this.settings().scale,
      this.hours24InDay(),
    );
    if (!p) return;
    this.selectMilestone.set(p);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollGraphToMilestoneEnd(m));
    });
  }

  /** Formats `date_calc` / `date` for the milestone list (user timezone). */
  protected milestoneListDateLabel(m: Milestone): string {
    const dCalc = m.date_calc ? parseUtcLike(m.date_calc) : null;
    const dDate = m.date ? parseUtcLike(m.date) : null;
    if (!dCalc && !dDate) return '';
    const tz = this.timezone();
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    const single = dCalc ?? dDate;
    if (!single) return '';
    try {
      const fmt = new Intl.DateTimeFormat(undefined, opts);
      if (dCalc && dDate) {
        const lo = dCalc < dDate ? dCalc : dDate;
        const hi = dCalc > dDate ? dCalc : dDate;
        const a = fmt.format(lo);
        const b = fmt.format(hi);
        return a === b ? a : `${a} — ${b}`;
      }
      return fmt.format(single);
    } catch {
      const fmt = new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      if (dCalc && dDate) {
        const lo = dCalc < dDate ? dCalc : dDate;
        const hi = dCalc > dDate ? dCalc : dDate;
        const a = fmt.format(lo);
        const b = fmt.format(hi);
        return a === b ? a : `${a} — ${b}`;
      }
      return fmt.format(single);
    }
  }

  /** Horizontally scrolls the graph so the milestone’s end date sits near the center. */
  private scrollGraphToMilestoneEnd(m: Milestone): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl || graphEl.clientWidth <= 0) return;
    const g = milestoneBarGeometry(
      m,
      this.dateStart(),
      this.settings().scale,
      this.hours24InDay(),
    );
    if (!g) return;
    const nextLeft = Math.max(
      0,
      Math.floor(g.endPx - graphEl.clientWidth / 2),
    );
    this.scrollLeftGraph.set(nextLeft);
  }

  /** Stripe index for the i-th root row (aligned with visible subtree sizes). */
  protected stripeIndexForRoot(i: number): number {
    const childs = this.rootChild().childs;
    if (!childs || i <= 0) return 0;
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += countVisibleTimelineRows(childs[j]);
    }
    return sum;
  }

  protected onQueryChanged(query: string): void {
    this.searchService.updateQuery(query || '');
  }

  protected onTimelineDragStart(): void {
    this.dragTimeline = true;
  }

  protected onTimelineDrag(deltaX: number): void {
    if (this.dragTimeline) {
      this.scrollLeftGraph.update((v) => Math.max(0, v + deltaX));
    }
  }

  protected onTimelineDragEnd(): void {
    this.dragTimeline = false;
  }

  protected onResizeDown(event: MouseEvent): void {
    event.preventDefault();
    this.prevTableScreenX = event.screenX;

    this.resizeTableHandle = this.renderer.listen(
      'window',
      'mousemove',
      (e: MouseEvent) => {
        const delta = this.prevTableScreenX - e.screenX;
        this.prevTableScreenX = e.screenX;
        const next = this.settings().tableWidth - delta;
        if (next >= 200 && next <= 800) {
          this.settingsService.setTableWidth(next);
        }
      },
    );

    this.resizeTableEndHandle = this.renderer.listen(
      'window',
      'mouseup',
      () => {
        this.resizeTableHandle?.();
        this.resizeTableEndHandle?.();
        this.resizeTableHandle = null;
        this.resizeTableEndHandle = null;
      },
    );
  }

  private toTree(groups: IssueGroup[]): TimelineIssue[] {
    return (groups || []).map((g) => ({
      id: g.id,
      type: 'group',
      title: this.getGroupTitle(g),
      _SHOWCHILDS: true,
      childs: this.sortIssueTree((g.issues || []) as TimelineIssue[]),
    }));
  }

  /** Ascending by start date (`date_start_calc`, else `date_start`); missing dates last. */
  private issueStartSortKey(issue: TimelineIssue): number {
    const calc = issue.date_start_calc;
    if (calc) {
      const d = parseUtcLike(calc);
      if (d) return d.getTime();
    }
    const ds = issue.date_start;
    if (ds) {
      const d = parseUtcLike(ds);
      if (d) return d.getTime();
    }
    return Number.MAX_SAFE_INTEGER;
  }

  private sortIssueTree(issues: TimelineIssue[]): TimelineIssue[] {
    if (!issues.length) return issues;
    return [...issues]
      .map((issue) => ({
        ...issue,
        childs: issue.childs?.length
          ? this.sortIssueTree(issue.childs)
          : issue.childs,
      }))
      .sort((a, b) => this.issueStartSortKey(a) - this.issueStartSortKey(b));
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

  /**
   * Scroll so "now" is centered. Uses the same virtual axis as the graph (`unixSecondsVirtual`).
   * Retries briefly if the graph host is not in the DOM yet (first paint after load).
   */
  private centerNow(): void {
    this.centerOnNow(0);
  }

  private centerOnNow(attempt: number): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl || graphEl.clientWidth <= 0) {
      if (attempt < 24) {
        requestAnimationFrame(() => this.centerOnNow(attempt + 1));
      }
      return;
    }
    const h24 = this.hours24InDay();
    const nowV = unixSecondsVirtual(new Date(), h24, '');
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const scale = this.settings().scale;
    const nowOffset = (nowV - startV) / scale;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nowOffset - graphEl.clientWidth / 2)));
  }

  private centerAtIssue(issue: TimelineIssue): void {
    const graphEl = this.graphScroll?.nativeElement;
    if (!graphEl) return;
    const centerDate = parseUtcLike(issue.date_start_calc);
    if (!centerDate) return;
    const h24 = this.hours24InDay();
    const centerV = unixSecondsVirtual(centerDate, h24, 'start');
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const nextLeft =
      (centerV - startV) / this.settings().scale - graphEl.clientWidth / 2;
    this.scrollLeftGraph.set(Math.max(0, Math.floor(nextLeft)));
  }

  private requestReload(): void {
    if (this.loading()) {
      this.pendingReload.set(true);
      return;
    }
    this.reloadCounter.update((v) => v + 1);
  }

  /**
   * Unique keys for @for over groups/issues: duplicate titles (e.g. fallback label)
   * must not collapse to one DOM node.
   */
  protected trackRootRow(index: number, row: TimelineIssue): string {
    const id = row.id;
    if (id !== undefined && id !== null && String(id).length > 0) {
      return String(id);
    }
    return `root-row-${index}`;
  }
}

