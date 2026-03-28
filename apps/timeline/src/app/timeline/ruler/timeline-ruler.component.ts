import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { TimelineTicksId } from '@renwu/core';
import { unixSeconds } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';

interface RulerLabel {
  text: string;
  position: number;
  width?: number;
}

@Component({
  selector: 'renwu-timeline-ruler',
  standalone: true,
  templateUrl: './timeline-ruler.component.html',
  styleUrl: './timeline-ruler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRulerComponent implements OnChanges {
  @Input() scale!: number;
  @Input() scaleTick!: TimelineTicksId | string;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() hours24InDay = true;
  /** X position of "now" in px; `null` hides the line. */
  @Input() nowLinePx: number | null = null;

  totalWidth = 0;
  majorLabels: RulerLabel[] = [];
  minorLabels: RulerLabel[] = [];
  gridLines: number[] = [];

  ngOnChanges(): void {
    this.generateLabels();
  }

  private origin(): number {
    return unixSecondsVirtual(this.dateStart, this.hours24InDay, '');
  }

  private generateLabels(): void {
    if (!this.dateStart || !this.dateEnd || !this.scale) return;

    const startUnix = unixSeconds(this.dateStart);
    const endUnix = unixSeconds(this.dateEnd);
    if (endUnix <= startUnix) return;

    const o = this.origin();
    const endV = unixSecondsVirtual(this.dateEnd, this.hours24InDay, '');
    this.totalWidth = (endV - o) / this.scale;
    const dayPx = 86400 / this.scale;

    this.majorLabels = [];
    this.minorLabels = [];
    this.gridLines = [];

    if (dayPx >= 30) {
      this.generateDayLabels(endUnix, o);
    } else if (dayPx >= 3) {
      this.generateWeekLabels(endUnix, o);
    } else {
      this.generateMonthLabels(endUnix, o);
    }
  }

  private generateDayLabels(endUnix: number, originVirtual: number): void {
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const start = new Date(this.dateStart);
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );

    let lastMonth = -1;
    const h24 = this.hours24InDay;

    while (unixSeconds(cursor) < endUnix) {
      const pos =
        (unixSecondsVirtual(cursor, h24, '') - originVirtual) / this.scale;

      if (cursor.getUTCMonth() !== lastMonth) {
        lastMonth = cursor.getUTCMonth();
        const monthEnd = new Date(
          Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
        );
        const monthEndPos =
          (unixSecondsVirtual(monthEnd, h24, '') - originVirtual) / this.scale;
        this.majorLabels.push({
          text: `${MONTH_NAMES[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`,
          position: Math.max(0, pos),
          width: monthEndPos - Math.max(0, pos),
        });
      }

      const nextDay = new Date(cursor.getTime());
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      const dayWidth =
        (unixSecondsVirtual(nextDay, h24, '') -
          unixSecondsVirtual(cursor, h24, '')) /
        this.scale;

      this.minorLabels.push({
        text: String(cursor.getUTCDate()),
        position: pos,
        width: dayWidth,
      });
      this.gridLines.push(pos);

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  private generateWeekLabels(endUnix: number, originVirtual: number): void {
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const start = new Date(this.dateStart);
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const dayOfWeek = cursor.getUTCDay();
    cursor.setUTCDate(cursor.getUTCDate() - ((dayOfWeek + 6) % 7));

    let lastMonth = -1;
    const h24 = this.hours24InDay;

    while (unixSeconds(cursor) < endUnix) {
      const pos =
        (unixSecondsVirtual(cursor, h24, '') - originVirtual) / this.scale;
      const nextWeek = new Date(cursor.getTime());
      nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
      const weekWidth =
        (unixSecondsVirtual(nextWeek, h24, '') -
          unixSecondsVirtual(cursor, h24, '')) /
        this.scale;

      if (cursor.getUTCMonth() !== lastMonth) {
        lastMonth = cursor.getUTCMonth();
        const monthEnd = new Date(
          Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
        );
        const monthEndPos =
          (unixSecondsVirtual(monthEnd, h24, '') - originVirtual) / this.scale;
        this.majorLabels.push({
          text: `${MONTH_NAMES[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`,
          position: Math.max(0, pos),
          width: monthEndPos - Math.max(0, pos),
        });
      }

      this.minorLabels.push({
        text: String(cursor.getUTCDate()),
        position: pos,
        width: weekWidth,
      });
      this.gridLines.push(pos);

      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  }

  private generateMonthLabels(endUnix: number, originVirtual: number): void {
    const MONTH_SHORT = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const start = new Date(this.dateStart);
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
    );

    let lastYear = -1;
    const h24 = this.hours24InDay;

    while (unixSeconds(cursor) < endUnix) {
      const pos =
        (unixSecondsVirtual(cursor, h24, '') - originVirtual) / this.scale;
      const nextMonth = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
      );
      const monthWidth =
        (unixSecondsVirtual(nextMonth, h24, '') -
          unixSecondsVirtual(cursor, h24, '')) /
        this.scale;

      if (cursor.getUTCFullYear() !== lastYear) {
        lastYear = cursor.getUTCFullYear();
        const yearEnd = new Date(
          Date.UTC(cursor.getUTCFullYear() + 1, 0, 1),
        );
        const yearEndPos =
          (unixSecondsVirtual(yearEnd, h24, '') - originVirtual) / this.scale;
        this.majorLabels.push({
          text: String(cursor.getUTCFullYear()),
          position: Math.max(0, pos),
          width: yearEndPos - Math.max(0, pos),
        });
      }

      this.minorLabels.push({
        text: MONTH_SHORT[cursor.getUTCMonth()],
        position: pos,
        width: monthWidth,
      });
      this.gridLines.push(pos);

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
}
