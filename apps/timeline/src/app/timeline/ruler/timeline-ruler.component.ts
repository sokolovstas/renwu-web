import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import moment from 'moment';

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
  @Input() dateStart!: moment.Moment;
  @Input() dateEnd!: moment.Moment;
  @Input() selectedUsers: unknown[] = [];
  @Input() linesOnly = false;
  @Input() selectMilestone: unknown;
}

