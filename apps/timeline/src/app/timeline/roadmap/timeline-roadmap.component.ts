import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Milestone } from '@renwu/core';

@Component({
  selector: 'renwu-timeline-roadmap',
  standalone: true,
  templateUrl: './timeline-roadmap.component.html',
  styleUrl: './timeline-roadmap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRoadmapComponent {
  @Input() items: Milestone[] = [];
}

