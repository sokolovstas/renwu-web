import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TimelineIssue } from '../models/timeline-issue.model';
import { addSecondsUtc, parseUtcLike, unixSeconds } from '../date-helpers';
import { TimelineItemDragDirective } from '../shared/directives/timeline-item-drag.directive';

@Component({
  selector: 'renwu-timeline-item',
  standalone: true,
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, TimelineItemComponent, TimelineItemDragDirective],
})
export class TimelineItemComponent implements OnChanges {
  @Input() item!: TimelineIssue;
  @Input() scale!: number;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() showTitleInside = false;
  @Input() showTitleRight = false;
  @Input() containerTop = 0;
  @Input() selectMilestone: unknown;
  @Input() timelineGraphContentBound: unknown;
  @Input() depth = 0;

  @Output() selected = new EventEmitter<TimelineIssue>();
  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() dragIssueStart = new EventEmitter<void>();
  @Output() dragIssueEnd = new EventEmitter<TimelineIssue>();
  @Output() issueLaidOut = new EventEmitter<TimelineIssue>();
  @Output() scrollRight = new EventEmitter<void>();
  @Output() scrollLeft = new EventEmitter<void>();
  @Output() increaseWidth = new EventEmitter<number>();

  protected width = 0;
  protected offsetForItem = 0;
  protected widthProgress = 0;
  protected lineWidth = 0;

  ngOnChanges(): void {
    this.recalculate();
  }

  protected recalculate(): void {
    if (!this.item || !this.dateStart || !this.dateEnd || !this.scale) {
      return;
    }
    const dateStartItem = this.item.date_start || this.item.date_start_calc;
    const dateEndItem = this.item.date_end || this.item.date_end_calc;
    if (!dateStartItem || !dateEndItem) {
      this.width = 0;
      return;
    }

    const start = parseUtcLike(dateStartItem);
    const end = parseUtcLike(dateEndItem);
    if (!start || !end) {
      this.width = 0;
      return;
    }

    const startUnix = unixSeconds(start);
    const endUnix = unixSeconds(end);
    const dateStartUnix = unixSeconds(this.dateStart);
    const dateEndUnix = unixSeconds(this.dateEnd);

    this.lineWidth =
      (dateEndUnix - dateStartUnix) / this.scale;
    this.offsetForItem = (startUnix - dateStartUnix) / this.scale;
    this.width = Math.max((endUnix - startUnix) / this.scale, 5);
    this.widthProgress = ((this.item.completion ?? 0) * this.width) / 100;
  }

  protected onItemClick(): void {
    this.scrollTo.emit(this.item);
  }

  protected onDrag(value: number): void {
    const currentStart = parseUtcLike(
      this.item.date_start || this.item.date_start_calc,
    );
    const currentEnd = parseUtcLike(
      this.item.date_end || this.item.date_end_calc,
    );
    if (!currentStart || !currentEnd) return;

    const nextStart = addSecondsUtc(currentStart, -value * this.scale);
    const nextEnd = addSecondsUtc(currentEnd, -value * this.scale);

    this.item.date_start = nextStart.toISOString();
    this.item.date_end = nextEnd.toISOString();
    this.recalculate();
  }
}

