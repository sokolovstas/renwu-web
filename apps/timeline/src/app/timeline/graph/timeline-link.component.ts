import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IssueBounds, TimelineLink } from '../models/timeline-issue.model';

@Component({
  selector: 'renwu-timeline-link',
  standalone: true,
  templateUrl: './timeline-link.component.html',
  styleUrl: './timeline-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineLinkComponent {
  @Input() data!: TimelineLink;
  @Input() issueBounds: IssueBounds | null = null;
  @Input() linkBounds: IssueBounds | null = null;
}

