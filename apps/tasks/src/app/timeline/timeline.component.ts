import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'renwu-tasks-timeline',
  standalone: true,
  imports: [],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {}
