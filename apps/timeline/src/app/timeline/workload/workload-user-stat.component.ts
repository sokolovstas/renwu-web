import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UserWorkloadItem } from '@renwu/core';

@Component({
  selector: 'renwu-timeline-workload-user-stat',
  standalone: true,
  templateUrl: './workload-user-stat.component.html',
  styleUrl: './workload-user-stat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadUserStatComponent {
  @Input() user: unknown;
  @Input() stat: unknown;
  @Input() items: UserWorkloadItem[] = [];
}

