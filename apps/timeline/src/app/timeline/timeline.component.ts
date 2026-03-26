import {
  ChangeDetectionStrategy,
  Component,
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
  TimelineService as CoreTimelineService,
  User,
  UserWorkload,
} from '@renwu/core';
import { TimelineSettingsService } from './services/timeline-settings.service';
import { TimelineTableItemComponent } from './table/timeline-table-item.component';
import { TimelineItemComponent } from './graph/timeline-item.component';
import { IssueTreeRoot, TimelineIssue } from './models/timeline-issue.model';
import { TimelineDataService } from './services/timeline-data.service';
import { TimelineRoadmapComponent } from './roadmap/timeline-roadmap.component';
import { WorkloadUserComponent } from './workload/workload-user.component';
import { forkJoin, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-timeline-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TimelineDataService, TimelineSettingsService],
  imports: [
    TimelineScaleComponent,
    TimelineRulerComponent,
    TimelineTableItemComponent,
    TimelineItemComponent,
    TimelineRoadmapComponent,
    WorkloadUserComponent,
  ],
})
export class TimelineComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(RwUserService);
  private readonly settingsService = inject(TimelineSettingsService);
  private readonly dataService = inject(TimelineDataService);
  private readonly coreTimelineService = inject(CoreTimelineService);

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

  private readonly routeContainerKey = toSignal(
    this.route.queryParamMap.pipe(map((qp) => qp.get('container_key') || '')),
    { initialValue: '' },
  );

  constructor() {
    // Load persisted settings once the current user is available.
    effect(() => {
      const userId = this.currentUser()?.id;
      this.settingsService.initFromLocalStorage(userId ?? undefined);
    });

    effect(() => {
      const grouping = this.settings().grouping || 'none';
      const routeContainerKey = this.routeContainerKey();
      const user = this.currentUser();
      this.loading.set(true);

      this.dataService
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
              groups: this.dataService.loadIssueTree(container.id, grouping, {}),
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
            this.roadmapItems.set(milestones || []);
            const timezone = this.userService.getTimeZone(this.currentUser() ?? undefined) || 'UTC';
            const range = this.coreTimelineService.calcMinMaxDate(groups ?? [], timezone);
            this.dateStart.set(range.dateStart);
            this.dateEnd.set(range.dateEnd);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });

      if (user?.id) {
        this.dataService
          .loadUserWorkload(user.id, {})
          .subscribe((value) => this.workload.set(value));
      }
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
    void item;
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

