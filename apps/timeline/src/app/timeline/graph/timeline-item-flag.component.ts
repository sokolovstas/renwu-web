import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TimelineIssue } from '../models/timeline-issue.model';

@Component({
  selector: 'renwu-timeline-item-flag',
  standalone: true,
  templateUrl: './timeline-item-flag.component.html',
  styleUrl: './timeline-item-flag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineItemFlagComponent {
  @Input() item!: TimelineIssue;

  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() selectItem = new EventEmitter<TimelineIssue | null>();
}

