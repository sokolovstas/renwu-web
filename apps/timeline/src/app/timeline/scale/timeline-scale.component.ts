import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwRangeComponent,
  RwSelectComponent,
  RwSwitchComponent,
  ISelectItem,
  SelectModelBase,
} from '@renwu/components';
import { RwIssueDateTimeService, TimelineTicksId } from '@renwu/core';
import { TimelineSettingsService } from '../services/timeline-settings.service';

@Component({
  selector: 'renwu-timeline-scale',
  standalone: true,
  templateUrl: './timeline-scale.component.html',
  styleUrl: './timeline-scale.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  protected scaleTickModel = this.createScaleTickModel();

  get settings() {
    return this.settingsService.getTimeline();
  }

  get scalePercent(): number {
    return this.settings.scaleValue;
  }

  ngOnInit(): void {
    this.refreshSelectLabels();
    this.transloco.langChanges$
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

  protected onShowMilestonesChange(value: boolean): void {
    this.settingsService.setShowMilestones(value);
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
    this.issueDateTimeSvc.issueDateTime.hours24InDay = !showEightHourWorkday;
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
    this.groupingModel.staticData = this.buildGroupingItems();
    const grouping = this.settingsService.getTimeline().grouping || 'none';
    void this.groupingModel.setData(grouping);
    void this.groupingModel.loadPage(0);

    this.scaleTickModel.staticData = this.buildScaleTickItems();
    const tick = this.settingsService.getTimeline().scaleTick;
    void this.scaleTickModel.setData(tick);
    void this.scaleTickModel.loadPage(0);
  }

  private buildGroupingItems(): ISelectItem<string>[] {
    const t = this.transloco;
    return [
      { id: 'none', label: t.translate('timeline.groupingNone') },
      { id: 'type', label: t.translate('timeline.groupingType') },
      { id: 'status', label: t.translate('timeline.groupingStatus') },
      { id: 'assignee', label: t.translate('timeline.groupingAssignee') },
    ];
  }

  private buildScaleTickItems(): ISelectItem<string>[] {
    const ticks = this.settingsService.ticks.filter((x) => x.id !== TimelineTicksId.FIT);
    return ticks.map((x) => ({
      id: x.id,
      label: this.translateTickLabel(x.id),
    }));
  }

  private translateTickLabel(id: TimelineTicksId): string {
    const keys: Partial<Record<TimelineTicksId, string>> = {
      [TimelineTicksId.FIT]: 'timeline.tickFit',
      [TimelineTicksId.DAY]: 'timeline.tickDay',
      [TimelineTicksId.WEEK]: 'timeline.tickWeek',
      [TimelineTicksId.QUARTER]: 'timeline.tickQuarter',
    };
    const key = keys[id];
    return key ? this.transloco.translate(key) : String(id);
  }

  private createGroupingModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    /** Resolve selected row from `staticData` by id so `label` is shown, not raw `id`. */
    model.loadSelected = true;
    model.staticData = this.buildGroupingItems();
    void model.setData(this.settingsService.getTimeline().grouping || 'none');
    return model;
  }

  private createScaleTickModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.staticData = this.buildScaleTickItems();
    void model.setData(this.settingsService.getTimeline().scaleTick);
    return model;
  }
}
