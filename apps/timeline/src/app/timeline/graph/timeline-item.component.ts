import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import moment from 'moment';
import { NgStyle } from '@angular/common';
import { TimelineIssue } from '../models/timeline-issue.model';
import { TimelineItemDragDirective } from '../shared/directives/timeline-item-drag.directive';

@Component({
  selector: 'renwu-timeline-item',
  standalone: true,
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, TimelineItemComponent, TimelineItemDragDirective],
})
export class TimelineItemComponent {
  @Input() item!: TimelineIssue;
  @Input() scale!: number;
  @Input() dateStart!: moment.Moment;
  @Input() dateEnd!: moment.Moment;
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
    const start = moment.utc(dateStartItem);
    const end = moment.utc(dateEndItem);
    this.lineWidth = (this.dateEnd.unix() - this.dateStart.unix()) / this.scale;
    this.offsetForItem = (start.unix() - this.dateStart.unix()) / this.scale;
    this.width = Math.max((end.unix() - start.unix()) / this.scale, 5);
    this.widthProgress = ((this.item.completion ?? 0) * this.width) / 100;
  }

  protected onItemClick(): void {
    this.scrollTo.emit(this.item);
  }

  protected onDrag(value: number): void {
    const dateStart = moment
      .utc(this.item.date_start || this.item.date_start_calc)
      .add(-value * this.scale, 'seconds');
    const dateEnd = moment
      .utc(this.item.date_end || this.item.date_end_calc)
      .add(-value * this.scale, 'seconds');
    this.item.date_start = dateStart.toISOString();
    this.item.date_end = dateEnd.toISOString();
    this.recalculate();
  }
}

