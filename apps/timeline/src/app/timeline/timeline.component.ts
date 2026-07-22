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
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  Issue,
  IssueGroup,
  IssueLinks,
  ListOptions,
  Milestone,
  QueryBuilderComponent,
  RwDataService,
  RwIssueDateTimeService,
  RwIssueService,
  RwQueryBuilderService,
  RwSearchService,
  RwShortcutService,
  RwUserService,
  RwWebsocketService,
  TimelineService as CoreTimelineService,
  User,
  UserWorkload,
} from '@renwu/core';
import {
  debounceTime,
  filter,
  forkJoin,
  map,
  merge,
  of,
  switchMap,
} from 'rxjs';
import { TimelineItemComponent } from './graph/timeline-item.component';
import { TimelineLinkComponent } from './graph/timeline-link.component';
import { TimelineParentScopeComponent } from './graph/timeline-parent-scope.component';
import { buildTimelineParentScopeLayouts } from './graph/parent-scope-layout';
import { clampTimelinePan } from './canvas-pan';
import { addMonthsUtc, parseUtcLike, unixSeconds } from './date-helpers';
import {
  TimelineCreateDirection,
  timelineIssueToLink,
} from './issue-to-link';
import {
  IssueTreeRoot,
  TimelineIssue,
  TimelineLink,
} from './models/timeline-issue.model';
import { TimelineRoadmapComponent } from './roadmap/timeline-roadmap.component';
import {
  milestoneBarGeometry,
  milestoneSelectPayload,
} from './roadmap/milestone-select-helpers';
import {
  countVisibleTimelineRows,
  flattenVisibleTimelinePreorder,
} from './row-striping';
import { TimelineRulerComponent } from './ruler/timeline-ruler.component';
import { TimelineScaleComponent } from './scale/timeline-scale.component';
import { TimelineDataService } from './services/timeline-data.service';
import { TimelineSettingsService } from './services/timeline-settings.service';
import { TimelineStateService } from './services/timeline-state.service';
import {
  TimelineHolderDirective,
  TimelinePanDelta,
} from './shared/directives/timeline-holder.directive';
import { TimelineTableItemComponent } from './table/timeline-table-item.component';
import { unixSecondsVirtual } from './virtual-hours';
import { WorkloadUserComponent } from './workload/workload-user.component';

type SelectedMilestone = { id: string; offset: number; due: boolean } | null;

export interface TimelineLinkLayout {
  link: TimelineLink;
  issueRowIndex: number;
  linkRowIndex: number;
}

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
    RwQueryBuilderService,
  ],
  imports: [
    QueryBuilderComponent,
    TimelineScaleComponent,
    TimelineRulerComponent,
    TimelineTableItemComponent,
    TimelineItemComponent,
    TimelineLinkComponent,
    TimelineParentScopeComponent,
    TimelineRoadmapComponent,
    WorkloadUserComponent,
    TimelineHolderDirective,
    TranslocoPipe,
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
  private readonly issueService = inject(RwIssueService);
  private readonly websocketService = inject(RwWebsocketService);
  private readonly shortcutService = inject(RwShortcutService);
  private readonly settingsService = inject(TimelineSettingsService);
  private readonly dataService = inject(TimelineDataService);
  private readonly coreTimelineService = inject(CoreTimelineService);
  private readonly stateService = inject(TimelineStateService);
  private readonly sidebarService = inject(RenwuSidebarService);
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

  /** Personal/RW timeline (`/timeline/RW/...`); container timeline shows OQL editor. */
  protected readonly isWorkload = toSignal(
    merge(
      of(null),
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    ).pipe(map(() => /(^|\/)RW(\/|$)/.test(this.router.url))),
    { initialValue: /(^|\/)RW(\/|$)/.test(this.router.url) },
  );

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

  /** Total height of the milestone strip (`milestones × milestoneRowHeightPx`). */
  protected readonly roadmapBandHeightPx = computed(() => {
    const s = this.settings();
    if (!s.showMilestones) return 0;
    return this.roadmapItems().length * s.milestoneRowHeightPx;
  });

  /** Must match ruler chrome + `--timeline-header-height`. */
  protected readonly headerHeightPx = 41;

  /** Visible issue/group rows + roadmap band (world height for vertical clamp). */
  protected readonly contentHeightPx = computed(() => {
    this.treeRevision();
    const s = this.settings();
    const roots = this.rootChild().childs;
    let rows = 0;
    for (const root of roots || []) {
      rows += countVisibleTimelineRows(root);
    }
    return this.roadmapBandHeightPx() + rows * s.issueRowHeightPx;
  });

  /**
   * Vertical dashed line at the milestone bar’s end (same px as roadmap), from the top of the graph
   * down to the bottom of the last visible row that references this milestone.
   */
  protected readonly milestoneEndMarkers = computed(() => {
    this.treeRevision();
    const s = this.settings();
    if (!s.showMilestones) return [];
    const milestones = this.roadmapItems();
    const roots = this.rootChild().childs;
    if (!milestones.length || !roots?.length) return [];

    const band = this.roadmapBandHeightPx();
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
        leftPx: g.rightPx,
        heightPx: band + (lastIdx + 1) * rowH,
        due: g.due,
      });
    }
    return markers;
  });

  protected readonly loading = signal(false);
  protected readonly workload = signal<UserWorkload | null>(null);
  protected readonly links = signal<TimelineLink[]>([]);

  /** Bumped when expand/collapse changes visible rows (OnPush refresh). */
  protected readonly treeRevision = signal(0);

  /** Visible row indices for dependency connectors (same preorder as graph rows). */
  protected readonly linksLayout = computed((): TimelineLinkLayout[] => {
    this.treeRevision();
    const links = this.links();
    const roots = this.rootChild().childs;
    if (!links.length || !roots?.length) return [];

    const flat = flattenVisibleTimelinePreorder(roots);
    const rowById = new Map<string, number>();
    flat.forEach((node, index) => {
      if (String(node.type) === 'group') return;
      const id = node.id;
      if (id !== undefined && id !== null && String(id).length > 0) {
        rowById.set(String(id), index);
      }
    });

    const out: TimelineLinkLayout[] = [];
    for (const link of links) {
      const issueId = link.issue?.id;
      const linkedId = link.link?.id;
      if (issueId == null || linkedId == null) continue;
      const issueRowIndex = rowById.get(String(issueId));
      const linkRowIndex = rowById.get(String(linkedId));
      if (issueRowIndex === undefined || linkRowIndex === undefined) continue;
      out.push({ link, issueRowIndex, linkRowIndex });
    }
    return out;
  });

  /** Semi-transparent parent scope boxes on the graph (parent + visible children). */
  protected readonly parentScopeLayouts = computed(() => {
    this.treeRevision();
    const roots = this.rootChild().childs;
    if (!roots?.length) return [];

    const s = this.settings();
    return buildTimelineParentScopeLayouts(roots, {
      dateStart: this.dateStart(),
      scale: s.scale,
      hours24InDay: this.hours24InDay(),
      issueRowHeightPx: s.issueRowHeightPx,
      roadmapBandHeightPx: this.roadmapBandHeightPx(),
    });
  });

  /** Camera offset over the Gantt world (CSS transform, not native scroll). */
  protected readonly panX = signal(0);
  protected readonly panY = signal(0);
  protected readonly worldTransform = computed(
    () => `translate3d(${-this.panX()}px, ${-this.panY()}px, 0)`,
  );
  protected readonly rulerTransform = computed(
    () => `translate3d(${-this.panX()}px, 0, 0)`,
  );
  protected readonly tableTransform = computed(
    () => `translate3d(0, ${-this.panY()}px, 0)`,
  );
  private readonly activeContainerId = signal<string | null>(null);
  private readonly pendingReload = signal(false);
  private selectedIssueId: string | null = null;
  /** Synced hover highlight between table and graph rows (issue id). */
  protected readonly hoveredIssueId = signal<string | null>(null);
  /** Hovered dependency connector (takes precedence for task dimming). */
  protected readonly hoveredLinkKey = signal<string | null>(null);

  /** Issue ids that stay bright while a link is hovered. */
  protected readonly linkFocusIssueIds = computed((): Set<string> | null => {
    const linkKey = this.hoveredLinkKey();
    if (!linkKey) return null;

    const layout = this.linksLayout().find(
      (entry) => this.linkKeyFor(entry.link) === linkKey,
    );
    if (!layout) return null;

    return new Set([
      String(layout.link.issue.id),
      String(layout.link.link.id),
    ]);
  });

  /** Accent color on hovered link or links of hovered issue. */
  protected readonly highlightedLinkKeys = computed((): Set<string> => {
    const hoveredLink = this.hoveredLinkKey();
    if (hoveredLink) return new Set([hoveredLink]);

    const issueId = this.hoveredIssueId();
    if (!issueId) return new Set<string>();

    const out = new Set<string>();
    for (const layout of this.linksLayout()) {
      const { issue, link } = layout.link;
      const iid = String(issue.id);
      const lid = String(link.id);
      if (iid === issueId || lid === issueId) {
        out.add(this.linkKeyFor(layout.link));
      }
    }
    return out;
  });

  private dragTimeline = false;
  private resizeTableHandle: (() => void) | null = null;
  private resizeTableEndHandle: (() => void) | null = null;
  private prevTableScreenX = 0;
  private zoomPersistTimer: ReturnType<typeof setTimeout> | null = null;
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
      this.settingsService.initSettings(userId ?? undefined);
    });

    effect((onCleanup) => {
      const params = this.queryParams();
      const routeContainerKey = params.containerKey;
      const queryHash = this.queryHash() || params.queryHash;
      const grouping = this.settingsService.grouping() || 'none';
      const hierarchy = this.settingsService.hierarchyMode() || 'subtasks';
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
              hierarchy,
              ...(query ? { q: query } : {}),
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
            const apiGroups = groups ?? [];
            this.applyServerGroups(apiGroups);
            this.roadmapItems.set(milestones || []);
            const timezone = this.userService.getTimeZone(this.currentUser() ?? undefined) || 'UTC';
            const range = this.coreTimelineService.calcMinMaxDate(
              apiGroups,
              timezone,
            );
            this.links.set(
              this.dataService.parseLinksFromIssues(
                this.rootChild().childs,
                range.issuesMap,
              ) as unknown as TimelineLink[],
            );
            this.dateStart.set(range.dateStart);
            this.dateEnd.set(range.dateEnd);
            this.loading.set(false);
            this.treeRevision.update((v) => v + 1);
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
      this.applyPanDelta(-100, 0);
    });
    const right = this.shortcutService.subscribe('ArrowRight', () => {
      this.applyPanDelta(100, 0);
    });
    const up = this.shortcutService.subscribe('ArrowUp', () => {
      this.applyPanDelta(0, -100);
    });
    const down = this.shortcutService.subscribe('ArrowDown', () => {
      this.applyPanDelta(0, 100);
    });
    this.destroyRef.onDestroy(() => {
      left?.unsubscribe();
      right?.unsubscribe();
      up?.unsubscribe();
      down?.unsubscribe();
    });

    effect(() => {
      if (!this.loading() && this.pendingReload()) {
        this.pendingReload.set(false);
        this.reloadCounter.update((v) => v + 1);
      }
    });

    // Re-clamp X when track size or table chrome width changes.
    effect(() => {
      this.timelineTrackWidthPx();
      this.settings().tableWidth;
      untracked(() => this.clampPanToBounds());
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

    afterNextRender(
      () => {
        const el = this.graphScroll?.nativeElement;
        if (!el) return;

        // Non-passive so pinch / ctrl+wheel can preventDefault (page zoom).
        const onWheel = (event: WheelEvent) => this.onViewportWheel(event);
        el.addEventListener('wheel', onWheel, { passive: false });

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(() => this.clampPanToBounds());
          ro.observe(el);
        }

        this.destroyRef.onDestroy(() => {
          el.removeEventListener('wheel', onWheel);
          ro?.disconnect();
          if (this.zoomPersistTimer) {
            clearTimeout(this.zoomPersistTimer);
            this.zoomPersistTimer = null;
          }
        });
      },
      { injector: this.injector },
    );
  }

  protected onScaleChanged(): void {
    this.hours24InDay.set(this.issueDateTimeSvc.issueDateTime.hours24InDay);
    const graphW = this.graphViewportWidth();
    if (graphW <= 0) return;
    const h24 = this.hours24InDay();
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const centerPx = this.panX() + graphW / 2;
    const centerVirtual = startV + centerPx * this.settings().oldScale;
    const nextLeft =
      (centerVirtual - startV) / this.settings().scale - graphW / 2;
    this.setPan(nextLeft, this.panY());
  }

  protected onFitToScreen(): void {
    const graphW = this.graphViewportWidth();
    if (graphW <= 0) return;
    const idealScale =
      (unixSeconds(this.dateEnd()) - unixSeconds(this.dateStart())) / graphW;
    const ticks = this.settingsService.ticks;
    for (const tick of ticks) {
      if (!tick.scale) continue;
      if (idealScale > tick.min && idealScale <= tick.scale) {
        let pct = Math.round((tick.scale * 50) / idealScale);
        pct = Math.max(50, Math.min(200, pct));
        this.settingsService.setScaleTick(tick.id);
        this.settingsService.setScaleValue(pct);
        this.setPan(0, this.panY());
        return;
      }
    }
    const lastTick = ticks[ticks.length - 1];
    if (lastTick) {
      this.settingsService.setScaleTick(lastTick.id);
      this.settingsService.setScaleValue(50);
      this.setPan(0, this.panY());
    }
  }

  protected onScrollTo(item: TimelineIssue): void {
    this.onSelected(item);
    this.centerAtIssue(item);
    if (String(item.type) !== 'group' && item?.key) {
      this.sidebarService.currentTask.next(item as Issue);
    }
  }

  /**
   * Open create-task form with relationship prefilled:
   * left=prev, right=next, top=parent, bottom=child.
   */
  protected async onCreateRelated(event: {
    issue: TimelineIssue;
    direction: TimelineCreateDirection;
  }): Promise<void> {
    const issue = event.issue;
    if (!issue?.id || String(issue.type) === 'group') return;
    if (!issue.container?.id) return;

    const empty: IssueLinks = {
      parent: [],
      prev_issue: [],
      next_issue: [],
      related: [],
    };
    const selfLink = timelineIssueToLink(issue);
    let links: IssueLinks = empty;

    switch (event.direction) {
      case 'child':
        links = { ...empty, parent: [selfLink] };
        this.issueService.clearPendingSubtasks();
        break;
      case 'next':
        links = { ...empty, prev_issue: [selfLink] };
        this.issueService.clearPendingSubtasks();
        break;
      case 'prev':
        links = { ...empty, next_issue: [selfLink] };
        this.issueService.clearPendingSubtasks();
        break;
      case 'parent':
        links = empty;
        break;
    }

    await this.router.navigate([{ outlets: { section: ['task', 'new'] } }]);
    setTimeout(() => {
      this.issueService.updateFromTemplate({
        container: issue.container,
        links,
      } as Issue);
      if (event.direction === 'parent') {
        // Show on create form Subtasks; linked for real in RwIssueService.create().
        this.issueService.setPendingSubtasks([selfLink]);
      }
    });
  }

  protected onTreeExpanded(): void {
    this.stateService.recalculateIndexes(this.rootChild());
    this.treeRevision.update((v) => v + 1);
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

  protected linkKeyFor(link: TimelineLink): string {
    return `${link.issue.id}-${link.link.id}-${link.type}`;
  }

  protected isLinkHighlighted(layout: TimelineLinkLayout): boolean {
    return this.highlightedLinkKeys().has(this.linkKeyFor(layout.link));
  }

  protected onLinkHover(layout: TimelineLinkLayout, inside: boolean): void {
    const key = this.linkKeyFor(layout.link);
    if (inside) {
      this.hoveredLinkKey.set(key);
      return;
    }
    if (this.hoveredLinkKey() === key) {
      this.hoveredLinkKey.set(null);
    }
  }

  protected isIssueDimmed(issueId: string | null | undefined): boolean {
    const focus = this.linkFocusIssueIds();
    if (!focus || issueId == null) return false;
    return !focus.has(String(issueId));
  }

  protected isParentScopeHighlighted(layout: {
    issueIds: string[];
  }): boolean {
    const hoveredId = this.hoveredIssueId();
    if (!hoveredId) return false;
    return layout.issueIds.includes(hoveredId);
  }

  protected currentUserValue(): User | null {
    return this.currentUser() ?? null;
  }

  protected onViewportWheel(event: WheelEvent): void {
    event.preventDefault();
    // Trackpad pinch (and ctrl/cmd+wheel) → zoom; plain wheel → pan.
    if (event.ctrlKey || event.metaKey) {
      this.applyGestureZoom(event);
      return;
    }
    const dx =
      event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
    const dy =
      event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY;
    this.applyPanDelta(dx, dy);
  }

  /**
   * Pinch / ctrl+wheel zoom toward the cursor (graph X), keeping that date fixed.
   * Integer percent; at 50%/200% switches Day↔Week↔Quarter. Persists after settle.
   */
  private applyGestureZoom(event: WheelEvent): void {
    const viewport = this.graphScroll?.nativeElement;
    if (!viewport) return;

    const graphW = this.graphViewportWidth();
    if (graphW <= 0) return;

    const tableW = this.settings().tableWidth;
    const rect = viewport.getBoundingClientRect();
    const cursorGraphX = event.clientX - rect.left - tableW;
    const anchorX =
      cursorGraphX >= 0 && cursorGraphX <= graphW ? cursorGraphX : graphW / 2;

    const oldScale = this.settings().scale;
    if (!oldScale) return;

    const h24 = this.hours24InDay();
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const focusVirtual = startV + (this.panX() + anchorX) * oldScale;

    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16; // DOM_DELTA_LINE
    if (event.deltaMode === 2) delta *= graphW; // DOM_DELTA_PAGE
    const factor = Math.exp(-delta * 0.01);

    if (!this.settingsService.applyGestureZoomFactor(factor, { persist: false })) {
      return;
    }

    const newScale = this.settings().scale;
    if (!newScale) return;

    this.setPan((focusVirtual - startV) / newScale - anchorX, this.panY());
    this.scheduleZoomPersist();
  }

  private scheduleZoomPersist(): void {
    if (this.zoomPersistTimer) clearTimeout(this.zoomPersistTimer);
    this.zoomPersistTimer = setTimeout(() => {
      this.zoomPersistTimer = null;
      this.settingsService.persistScale();
    }, 280);
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

  /** Pans so the milestone’s end date sits near the center of the graph window. */
  private scrollGraphToMilestoneEnd(m: Milestone): void {
    const graphW = this.graphViewportWidth();
    if (graphW <= 0) return;
    const g = milestoneBarGeometry(
      m,
      this.dateStart(),
      this.settings().scale,
      this.hours24InDay(),
    );
    if (!g) return;
    this.setPan(g.rightPx - graphW / 2, this.panY());
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
    const next = (query || '').trim();
    if (!next) {
      // RwSearchService.onChange() ignores empty query — clear filter locally.
      this.queryString.set('');
      this.queryHash.set('');
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { query_hash: null },
        queryParamsHandling: 'merge',
      });
      this.requestReload();
      return;
    }
    this.searchService.updateQuery(next);
  }

  protected onTimelineDragStart(): void {
    this.dragTimeline = true;
  }

  protected onTimelineDrag(delta: TimelinePanDelta): void {
    if (!this.dragTimeline) return;
    this.applyPanDelta(delta.deltaX, delta.deltaY);
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

  /**
   * Maps server groups to the UI row model. No regrouping — only expand state
   * (`_SHOWCHILDS`) and group titles for display.
   */
  private applyServerGroups(groups: IssueGroup[]): void {
    const childs = (groups || []).map((group, index) => {
      const id = this.serverGroupId(group, index);
      return {
        id,
        type: 'group' as const,
        title: this.getGroupTitle(group),
        _SHOWCHILDS: this.groupShowChildsById(id),
        childs: this.applyExpandState((group.issues || []) as TimelineIssue[]),
      };
    });
    this.rootChild.set({
      type: 'root',
      _SHOWCHILDS: true,
      childs,
    });
    this.stateService.recalculateIndexes(this.rootChild());
  }

  private serverGroupId(group: IssueGroup, index: number): string {
    if (group.id) {
      return String(group.id);
    }
    const key = group.key as { id?: string } | null;
    if (key?.id) {
      return key.id;
    }
    if (group.key == null) {
      return 'all';
    }
    return `group-${index}`;
  }

  private groupShowChildsById(key: string): boolean {
    const stored = this.settings().open_index_group[key];
    return stored !== undefined ? stored : true;
  }

  private issueShowChilds(issue: TimelineIssue): boolean {
    if (issue.id) {
      const stored = this.settings().open_index[issue.id];
      if (stored !== undefined) {
        return stored;
      }
    }
    return issue._SHOWCHILDS ?? true;
  }

  private applyExpandState(issues: TimelineIssue[]): TimelineIssue[] {
    if (!issues.length) return issues;
    return issues.map((issue) => ({
      ...issue,
      _SHOWCHILDS: this.issueShowChilds(issue),
      childs: issue.childs?.length
        ? this.applyExpandState(issue.childs)
        : issue.childs,
    }));
  }

  private getGroupTitle(group: IssueGroup): string {
    const key = group.key as {
      title?: string;
      full_name?: string;
      name?: string;
      label?: string;
      username?: string;
    } | null;
    return (
      key?.title ||
      key?.full_name ||
      key?.name ||
      key?.label ||
      key?.username ||
      this.translocoService.translate('timeline.groupFallback')
    );
  }

  /**
   * Pan so "now" is centered. Uses the same virtual axis as the graph (`unixSecondsVirtual`).
   * Retries briefly if the viewport is not measured yet (first paint after load).
   */
  private centerNow(): void {
    this.centerOnNow(0);
  }

  private centerOnNow(attempt: number): void {
    const graphW = this.graphViewportWidth();
    if (graphW <= 0) {
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
    this.setPan(nowOffset - graphW / 2, this.panY());
  }

  private centerAtIssue(issue: TimelineIssue): void {
    const graphW = this.graphViewportWidth();
    if (graphW <= 0) return;
    const centerDate = parseUtcLike(issue.date_start_calc);
    if (!centerDate) return;
    const h24 = this.hours24InDay();
    const centerV = unixSecondsVirtual(centerDate, h24, 'start');
    const startV = unixSecondsVirtual(this.dateStart(), h24, '');
    const nextLeft =
      (centerV - startV) / this.settings().scale - graphW / 2;
    this.setPan(nextLeft, this.panY());
  }

  /** Visible graph width (viewport minus sticky table chrome). */
  private graphViewportWidth(): number {
    const el = this.graphScroll?.nativeElement;
    if (!el) return 0;
    return Math.max(0, el.clientWidth - this.settings().tableWidth);
  }

  private applyPanDelta(deltaX: number, deltaY: number): void {
    this.setPan(this.panX() + deltaX, this.panY() + deltaY);
  }

  private setPan(x: number, y: number): void {
    const clamped = this.clampPanValues(x, y);
    this.panX.set(clamped.x);
    this.panY.set(clamped.y);
  }

  private clampPanToBounds(): void {
    const clamped = this.clampPanValues(this.panX(), this.panY());
    if (clamped.x !== this.panX()) this.panX.set(clamped.x);
    if (clamped.y !== this.panY()) this.panY.set(clamped.y);
  }

  /** Clamp camera X to the date track; Y is unrestricted. */
  private clampPanValues(x: number, y: number): { x: number; y: number } {
    return clampTimelinePan(
      x,
      y,
      this.timelineTrackWidthPx(),
      this.graphViewportWidth(),
    );
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

