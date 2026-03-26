import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Milestone } from '@renwu/core';

@Component({
  selector: 'renwu-timeline-roadmap-item',
  standalone: true,
  templateUrl: './timeline-roadmap-item.component.html',
  styleUrl: './timeline-roadmap-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRoadmapItemComponent {
  @Input() item!: Milestone;
}

