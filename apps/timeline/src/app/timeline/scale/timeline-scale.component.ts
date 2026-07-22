import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwRangeComponent,
  RwSelectComponent,
  RwSwitchComponent,
  ISelectItem,
  SelectModelBase,
} from '@renwu/components';
import {
  RwIssueDateTimeService,
  TimelineHierarchyMode,
  TimelineTicksId,
} from '@renwu/core';
import { forkJoin, merge } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { TimelineSettingsService } from '../services/timeline-settings.service';

const GROUPING_OPTIONS = [
  { id: 'none', key: 'groupingNone' },
  { id: 'type', key: 'groupingType' },
  { id: 'status', key: 'groupingStatus' },
  { id: 'assignee', key: 'groupingAssignee' },
] as const;

const HIERARCHY_OPTIONS = [
  { id: 'subtasks', key: 'hierarchySubtasks' },
  { id: 'leaves', key: 'hierarchyLeaves' },
] as const;

@Component({
  selector: 'renwu-timeline-scale',
  standalone: true,
  templateUrl: './timeline-scale.component.html',
  styleUrl: './timeline-scale.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    TranslocoPipe,
    FormsModule,
    RwButtonComponent,
    RwCheckboxComponent,
    RwRangeComponent,
    RwSelectComponent,
    RwSwitchComponent,
  ],
})
export class TimelineScaleComponent implements OnInit {
  private readonly settingsService = inject(TimelineSettingsService);
  private readonly transloco = inject(TranslocoService);
  private readonly translocoScope = inject(TRANSLOCO_SCOPE);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly issueDateTimeSvc = inject(RwIssueDateTimeService);

  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() isWorkload = false;
  @Input() timezone = 'UTC';

  @Output() changed = new EventEmitter<void>();
  @Output() fitToScreen = new EventEmitter<void>();
  @Output() nowClicked = new EventEmitter<void>();

  protected groupingModel = this.createGroupingModel();
  protected hierarchyModel = this.createHierarchyModel();
  protected scaleTickModel = this.createScaleTickModel();

  /** Reactive snapshot; use in template as `settings()` so OnPush updates when storage/slider changes. */
  protected readonly settings = computed(() => this.settingsService.timelineSettings());

  constructor() {
    // Keep tick select in sync when pinch-zoom crosses Day/Week/Quarter.
    effect(() => {
      const tick = this.settings().scaleTick;
      void this.scaleTickModel.setData(tick);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.refreshSelectLabels();

    this.issueDateTimeSvc.issueDateTime.show24HoursInDay
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    merge(
      this.transloco.langChanges$,
      this.transloco.events$.pipe(
        filter((event) => event.type === 'translationLoadSuccess'),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshSelectLabels();
        this.cdr.markForCheck();
      });
  }

  protected onGroupingChanged(items: ISelectItem<unknown>[]): void {
    const value = (items?.[0]?.id as string) || 'none';
    this.settingsService.setGrouping(value);
    this.changed.emit();
  }

  protected onHierarchyChanged(items: ISelectItem<unknown>[]): void {
    const value = (items?.[0]?.id as TimelineHierarchyMode) || 'subtasks';
    this.settingsService.setHierarchyMode(
      value === 'leaves' ? 'leaves' : 'subtasks',
    );
    this.changed.emit();
  }

  protected onShowMilestonesChange(value: boolean): void {
    this.settingsService.setShowMilestones(value);
    this.changed.emit();
  }

  protected onShowTitleRightChange(value: boolean): void {
    this.settingsService.setShowTitleRight(value);
    this.changed.emit();
  }

  protected onScaleTickChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    if (id) {
      this.settingsService.setScaleTick(id as TimelineTicksId);
      this.changed.emit();
    }
  }

  /**
   * Switch ON = показать ось как 8 рабочих часов (сжатие как в старом клиенте).
   * OFF = полные 24 часа на сутки (`IssueDateTime.hours24InDay` = true).
   */
  protected onEightHourAxisChange(showEightHourWorkday: boolean): void {
    this.settingsService.setHours24InDay(!showEightHourWorkday);
    this.changed.emit();
  }

  protected onSliderChange(value: number): void {
    this.settingsService.setScaleValue(value);
    this.changed.emit();
  }

  protected onFit(): void {
    this.fitToScreen.emit();
  }

  protected onNow(): void {
    this.nowClicked.emit();
  }

  private refreshSelectLabels(): void {
    const tickOptions = this.getScaleTickOptions();

    forkJoin({
      grouping: forkJoin(
        GROUPING_OPTIONS.map((option) =>
          this.transloco
            .selectTranslate(option.key, {}, this.translocoScope)
            .pipe(take(1)),
        ),
      ),
      hierarchy: forkJoin(
        HIERARCHY_OPTIONS.map((option) =>
          this.transloco
            .selectTranslate(option.key, {}, this.translocoScope)
            .pipe(take(1)),
        ),
      ),
      ticks: forkJoin(
        tickOptions.map((option) =>
          this.transloco
            .selectTranslate(option.key, {}, this.translocoScope)
            .pipe(take(1)),
        ),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ grouping, hierarchy, ticks }) => {
        this.groupingModel.staticData = GROUPING_OPTIONS.map((option, index) => ({
          id: option.id,
          label: grouping[index],
        }));
        const groupingValue = this.settingsService.getTimeline().grouping || 'none';
        void this.groupingModel.setData(groupingValue);
        void this.groupingModel.loadPage(0);

        this.hierarchyModel.staticData = HIERARCHY_OPTIONS.map(
          (option, index) => ({
            id: option.id,
            label: hierarchy[index],
          }),
        );
        const hierarchyValue =
          this.settingsService.getTimeline().hierarchyMode || 'subtasks';
        void this.hierarchyModel.setData(hierarchyValue);
        void this.hierarchyModel.loadPage(0);

        this.scaleTickModel.staticData = tickOptions.map((option, index) => ({
          id: option.id,
          label: ticks[index],
        }));
        const tick = this.settingsService.getTimeline().scaleTick;
        void this.scaleTickModel.setData(tick);
        void this.scaleTickModel.loadPage(0);

        this.cdr.markForCheck();
      });
  }

  private getScaleTickOptions(): Array<{ id: TimelineTicksId; key: string }> {
    return this.settingsService.ticks
      .filter((tick) => tick.id !== TimelineTicksId.FIT)
      .map((tick) => ({
        id: tick.id,
        key: this.tickTranslationKey(tick.id),
      }));
  }

  private tickTranslationKey(id: TimelineTicksId): string {
    const keys: Partial<Record<TimelineTicksId, string>> = {
      [TimelineTicksId.FIT]: 'tickFit',
      [TimelineTicksId.DAY]: 'tickDay',
      [TimelineTicksId.WEEK]: 'tickWeek',
      [TimelineTicksId.QUARTER]: 'tickQuarter',
    };
    return keys[id] ?? String(id);
  }

  private createGroupingModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    /** Resolve selected row from `staticData` by id so `label` is shown, not raw `id`. */
    model.loadSelected = true;
    model.staticData = GROUPING_OPTIONS.map((option) => ({
      id: option.id,
      label: option.id,
    }));
    void model.setData(this.settingsService.getTimeline().grouping || 'none');
    return model;
  }

  private createHierarchyModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.staticData = HIERARCHY_OPTIONS.map((option) => ({
      id: option.id,
      label: option.id,
    }));
    void model.setData(
      this.settingsService.getTimeline().hierarchyMode || 'subtasks',
    );
    return model;
  }

  private createScaleTickModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.staticData = this.getScaleTickOptions().map((option) => ({
      id: option.id,
      label: option.id,
    }));
    void model.setData(this.settingsService.getTimeline().scaleTick);
    return model;
  }
}
