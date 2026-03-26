import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import moment from 'moment';
import { TimelineRulerComponent } from './ruler/timeline-ruler.component';
import { TimelineScaleComponent } from './scale/timeline-scale.component';
import { RwUserService } from '@renwu/core';
import { TimelineSettingsService } from './services/timeline-settings.service';
import { TimelineTableItemComponent } from './table/timeline-table-item.component';
import { TimelineItemComponent } from './graph/timeline-item.component';
import { IssueTreeRoot, TimelineIssue } from './models/timeline-issue.model';

@Component({
  selector: 'renwu-timeline-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TimelineScaleComponent,
    TimelineRulerComponent,
    TimelineTableItemComponent,
    TimelineItemComponent,
  ],
})
export class TimelineComponent {
  private readonly userService = inject(RwUserService);
  private readonly settingsService = inject(TimelineSettingsService);

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

  constructor() {
    // Load persisted settings once the current user is available.
    effect(() => {
      const userId = this.currentUser()?.id;
      this.settingsService.initFromLocalStorage(userId ?? undefined);
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
}

