import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'renwu-timeline-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class TimelineComponent {}

