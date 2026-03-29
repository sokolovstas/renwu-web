import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  input,
} from '@angular/core';
import { Status } from '@renwu/core';
import { TimelineIssue } from '../models/timeline-issue.model';
import { visibleRowsBeforeChild } from '../row-striping';
import { parseUtcLike, unixSeconds } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';

/** Original UI: 18px bar height inside a 37px row — scale bar with `issueRowHeightPx`. */
const TIMELINE_BAR_TO_ROW_RATIO = 18 / 37;
const TIMELINE_BAR_HEIGHT_MIN_PX = 14;

@Component({
  selector: 'renwu-timeline-item',
  standalone: true,
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimelineItemComponent],
})
export class TimelineItemComponent implements OnChanges {
  issueRowHeightPx = input.required<number>();

  protected readonly barHeightPx = computed(() => {
    const row = this.issueRowHeightPx();
    return Math.max(
      TIMELINE_BAR_HEIGHT_MIN_PX,
      Math.round(row * TIMELINE_BAR_TO_ROW_RATIO),
    );
  });

  @Input() item!: TimelineIssue;
  /** DFS index among visible rows (striping aligned with the table column). */
  @Input() stripeIndex = 0;
  /** When set, row with this issue id is highlighted (sync with table hover). */
  @Input() highlightedId: string | null = null;
  @Input() scale!: number;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() hours24InDay = true;
  @Input() showTitleInside = false;
  @Input() showTitleRight = false;
  @Input() containerTop = 0;
  @Input() selectMilestone: unknown;
  @Input() timelineGraphContentBound: unknown;
  @Input() depth = 0;

  @Output() selected = new EventEmitter<TimelineIssue>();
  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() issueLaidOut = new EventEmitter<TimelineIssue>();
  @Output() scrollRight = new EventEmitter<void>();
  @Output() scrollLeft = new EventEmitter<void>();
  @Output() increaseWidth = new EventEmitter<number>();

  protected width = 0;
  protected offsetForItem = 0;
  protected widthProgress = 0;
  protected lineWidth = 0;
  protected barColor = '#d1d5db';
  protected progressColor = '#4b5563';
  protected isAutoScheduled = false;
  protected titleLabel = '';
  protected isGroup = false;

  ngOnChanges(): void {
    this.recalculate();
  }

  protected recalculate(): void {
    if (!this.item || !this.dateStart || !this.dateEnd || !this.scale) {
      return;
    }

    this.isGroup = String(this.item.type) === 'group';
    this.titleLabel = this.item.title || '';

    const statusObj = this.item.status as Status | string | undefined;
    const typeObj = this.item.type as
      | { color?: string; symbol?: string }
      | string
      | undefined;
    let base: string | undefined;
    if (statusObj && typeof statusObj === 'object' && statusObj.color) {
      base = statusObj.color;
    } else if (typeObj && typeof typeObj === 'object' && typeObj.color) {
      base = typeObj.color;
    }
    if (base) {
      this.barColor = base;
      this.progressColor = this.darkenColor(base, 30);
    } else {
      this.barColor = '#d1d5db';
      this.progressColor = '#4b5563';
    }

    this.isAutoScheduled = Boolean(this.item.auto_scheduling);

    const start = parseUtcLike(this.item.date_start_calc);
    const end = parseUtcLike(this.item.date_end_calc);
    if (!start || !end) {
      this.width = 0;
      return;
    }

    const h24 = this.hours24InDay;
    const startUnix = unixSecondsVirtual(start, h24, 'start');
    const endUnix = unixSecondsVirtual(end, h24, 'end');
    const dateStartUnix = unixSecondsVirtual(this.dateStart, h24, '');
    const dateEndUnix = unixSecondsVirtual(this.dateEnd, h24, '');

    this.lineWidth = (dateEndUnix - dateStartUnix) / this.scale;
    this.offsetForItem = (startUnix - dateStartUnix) / this.scale;
    this.width = Math.max((endUnix - startUnix) / this.scale, 5);
    this.widthProgress =
      ((this.item.completion ?? 0) * this.width) / 100;
  }

  protected childStripeIndex(childIndex: number): number {
    return this.stripeIndex + 1 + visibleRowsBeforeChild(this.item, childIndex);
  }

  get rowHighlighted(): boolean {
    const id = this.item?.id;
    if (id === undefined || id === null || id === '') return false;
    return String(id) === this.highlightedId;
  }

  protected onRowHover(inside: boolean): void {
    if (!this.item?.id) return;
    this.selected.emit({ ...this.item, __selected: inside } as TimelineIssue);
  }

  protected onItemClick(): void {
    this.scrollTo.emit(this.item);
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - percent);
    const g = Math.max(0, ((num >> 8) & 0xff) - percent);
    const b = Math.max(0, (num & 0xff) - percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
