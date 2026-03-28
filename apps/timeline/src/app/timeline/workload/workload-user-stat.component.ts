import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimelineTicksId, UserWorkloadItem } from '@renwu/core';
import { interval } from 'rxjs';
import { unixSeconds } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';
import {
  WorkloadUserItemComponent,
  WorkloadBar,
} from './workload-user-item.component';

@Component({
  selector: 'renwu-timeline-workload-user-stat',
  standalone: true,
  templateUrl: './workload-user-stat.component.html',
  styleUrl: './workload-user-stat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorkloadUserItemComponent],
})
export class WorkloadUserStatComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() user: unknown;
  @Input() stat: unknown;
  @Input() items: UserWorkloadItem[] = [];
  @Input() scaleTick: TimelineTicksId = TimelineTicksId.DAY;
  /** Aligns workload strip with timeline axis (`IssueDateTime` / virtual 8h day). */
  @Input() hours24InDay = true;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() scale = 5000;

  bars: WorkloadBar[] = [];
  totalWidth = 0;

  constructor() {
    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateBars();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(): void {
    this.calculateBars();
  }

  private calculateBars(): void {
    if (!this.dateStart || !this.dateEnd || !this.scale || !this.items?.length) {
      this.bars = [];
      return;
    }

    const h24 = this.hours24InDay;
    const origin = unixSecondsVirtual(this.dateStart, h24, '');
    const endAxis = unixSecondsVirtual(this.dateEnd, h24, '');
    this.totalWidth = (endAxis - origin) / this.scale;

    this.bars = this.items
      .map((item) => this.itemToBar(item, origin, h24))
      .filter((bar): bar is WorkloadBar => bar !== null);
  }

  private itemToBar(
    item: UserWorkloadItem,
    originVirtual: number,
    h24: boolean,
  ): WorkloadBar | null {
    const range = this.getItemRange(item);
    if (!range) return null;

    const startDate = new Date(range.startUnix * 1000);
    const endDate = new Date(range.endUnix * 1000);
    const v0 = unixSecondsVirtual(startDate, h24, '');
    const v1 = unixSecondsVirtual(endDate, h24, '');
    const position = (v0 - originVirtual) / this.scale;
    const widthRaw = (v1 - v0) / this.scale;
    const width = Math.max(widthRaw, 2);

    const totalCap = WorkloadUserStatComponent.num(item.total);
    const ttn = WorkloadUserStatComponent.num(item.time_to_now);
    const vtn = WorkloadUserStatComponent.num(item.value_to_now);
    const vfn = WorkloadUserStatComponent.num(item.value_from_now);
    const assignedSum = vfn + vtn;
    const remainder = totalCap - ttn;

    const periodLen = v1 - v0;
    const nowV = unixSecondsVirtual(new Date(), h24, '');
    const isCurrent =
      periodLen > 0 && nowV >= v0 && nowV < v1;
    /** Visual split only: share of period elapsed on the virtual timeline axis (matches “now” line). */
    const elapsedFrac =
      periodLen > 0
        ? Math.min(1, Math.max(0, (nowV - v0) / periodLen))
        : 0;

    const ri = (x: unknown): number =>
      Math.round(WorkloadUserStatComponent.num(x));

    if (
      isCurrent &&
      totalCap > 0 &&
      elapsedFrac > 0 &&
      elapsedFrac < 1
    ) {
      /* Match .workload-bar-split { gap: 1px } so halves are not flex-shrunk vs bar.width */
      const gapPx = 1;
      const innerW = Math.max(width - gapPx, 0);
      const leftW = innerW * elapsedFrac;
      const rightW = innerW * (1 - elapsedFrac);
      const leftRatio = ttn > 0 ? vtn / ttn : 0;
      const rightRatio = remainder > 0 ? vfn / remainder : 0;
      return {
        position,
        width,
        total: totalCap,
        capacity: totalCap,
        ratio: Math.max(leftRatio, rightRatio),
        split: {
          leftWidth: Math.max(leftW, 1),
          rightWidth: Math.max(rightW, 1),
          leftRatio,
          rightRatio,
          leftNum: ri(vtn),
          leftDen: ri(ttn),
          rightNum: ri(vfn),
          rightDen: ri(remainder),
        },
      };
    }

    const ratio = totalCap > 0 ? assignedSum / totalCap : 0;
    return {
      position,
      width,
      total: totalCap,
      capacity: totalCap,
      ratio,
      assignedSum,
    };
  }

  private getItemRange(item: UserWorkloadItem): { startUnix: number; endUnix: number } | null {
    switch (this.scaleTick) {
      case TimelineTicksId.QUARTER:
        return this.getQuarterRange(item.year, item.quarter);
      case TimelineTicksId.WEEK:
        return this.getMonthRange(item.year, item.month);
      default:
        return this.getWeekRange(item.year, item.week);
    }
  }

  private getWeekRange(year: number, week: number): { startUnix: number; endUnix: number } | null {
    if (!year || !week) return null;
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const isoWeek1Monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    const weekStart = new Date(isoWeek1Monday.getTime() + (week - 1) * 7 * 86400000);
    const startUnix = unixSeconds(weekStart);
    return { startUnix, endUnix: startUnix + 7 * 86400 };
  }

  private getMonthRange(year: number, month: number): { startUnix: number; endUnix: number } | null {
    if (!year || !month) return null;
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { startUnix: unixSeconds(start), endUnix: unixSeconds(end) };
  }

  private getQuarterRange(year: number, quarter: number): { startUnix: number; endUnix: number } | null {
    if (!year || !quarter) return null;
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 1));
    return { startUnix: unixSeconds(start), endUnix: unixSeconds(end) };
  }

  private static num(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
}
