import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'renwu-timeline-ruler',
  standalone: true,
  templateUrl: './timeline-ruler.component.html',
  styleUrl: './timeline-ruler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRulerComponent {
  @Input() scale!: number;
  @Input() scaleTick!: unknown;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() selectedUsers: unknown[] = [];
  @Input() linesOnly = false;
  @Input() selectMilestone: unknown;
}

