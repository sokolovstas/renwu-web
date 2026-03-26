import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import moment from 'moment';
import { TimelineIssue } from '../models/timeline-issue.model';

@Component({
  selector: 'renwu-timeline-table-item',
  standalone: true,
  templateUrl: './timeline-table-item.component.html',
  styleUrl: './timeline-table-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineTableItemComponent {
  @Input() item!: TimelineIssue;
  @Input() scale!: number;
  @Input() dateStart!: moment.Moment;
  @Input() dateEnd!: moment.Moment;
  @Input() showMilestones = true;
  @Input() selectMilestone: unknown;

  @Output() selected = new EventEmitter<TimelineIssue>();
}

