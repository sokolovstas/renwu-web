import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { TimelineTicksId, User, UserWorkload, UserWorkloadItem } from '@renwu/core';
import { WorkloadUserStatComponent } from './workload-user-stat.component';

@Component({
  selector: 'renwu-timeline-workload-user',
  standalone: true,
  templateUrl: './workload-user.component.html',
  styleUrl: './workload-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorkloadUserStatComponent],
})
export class WorkloadUserComponent {
  @Input() user: User | null = null;
  @Input() workload: UserWorkload | null = null;
  @Input() dateStart!: Date;
  @Input() dateEnd!: Date;
  @Input() scale = 5000;
  @Input() scaleTick: TimelineTicksId = TimelineTicksId.DAY;
  @Input() hours24InDay = true;

  get workloadItems(): UserWorkloadItem[] {
    const w = this.workload?.workload;
    if (!w) return [];
    switch (this.scaleTick) {
      case TimelineTicksId.QUARTER:
        return w.quarters || [];
      case TimelineTicksId.WEEK:
        return w.months || [];
      default:
        return w.weeks || [];
    }
  }
}
