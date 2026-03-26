import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import moment from 'moment';
import { TimelineIssue } from '../models/timeline-issue.model';

@Component({
  selector: 'renwu-timeline-item',
  standalone: true,
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  @Output() selected = new EventEmitter<TimelineIssue>();
  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() dragIssueStart = new EventEmitter<void>();
  @Output() dragIssueEnd = new EventEmitter<TimelineIssue>();
  @Output() issueLaidOut = new EventEmitter<TimelineIssue>();
  @Output() scrollRight = new EventEmitter<void>();
  @Output() scrollLeft = new EventEmitter<void>();
  @Output() increaseWidth = new EventEmitter<number>();
}

