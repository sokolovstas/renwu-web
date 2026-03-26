import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import moment from 'moment';
import { TimelineRulerComponent } from './ruler/timeline-ruler.component';
import { TimelineScaleComponent } from './scale/timeline-scale.component';
import {
  IssueGroup,
  Milestone,
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
import { forkJoin, map, of, switchMap } from 'rxjs';
import { TimelineStateService } from './services/timeline-state.service';
import { TimelineLinkComponent } from './graph/timeline-link.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'renwu-timeline-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TimelineDataService, TimelineSettingsService, TimelineStateService],
  imports: [
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(RwUserService);
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

  protected readonly dateStart = signal<moment.Moment>(moment.utc());
  protected readonly dateEnd = signal<moment.Moment>(
    moment.utc().add(1, 'month'),
  );

  protected readonly selectedUsers = signal<unknown[]>([]);
  protected readonly selectMilestone = signal<unknown>(null);
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
      const queryHash = params.queryHash;
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
              return of({ groups: [] as IssueGroup[], milestones: [] as Milestone[] });
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadCounter.update((v) => v + 1);
      });
    this.websocketService.workbot
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadCounter.update((v) => v + 1);
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
  }

  protected onScaleChanged(): void {
    // Placeholder for Phase 5+ wiring (graph recalculation etc).
  }

  protected onFitToScreen(): void {
    // Placeholder: later we will recompute dateStart/dateEnd from issues bounds.
    this.dateStart.set(moment.utc());
    this.dateEnd.set(moment.utc().add(1, 'month'));
  }

  protected onScrollTo(item: TimelineIssue): void {
    if (!item?.id) return;
    this.stateService.setSelected(item.id, true);
  }

  protected onSelected(item: TimelineIssue): void {
    if (!item?.id) return;
    this.stateService.setSelected(item.id, true);
  }

  protected currentUserValue(): User | null {
    return this.currentUser() ?? null;
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
    return key?.title || key?.full_name || key?.name || 'Group';
  }
}

