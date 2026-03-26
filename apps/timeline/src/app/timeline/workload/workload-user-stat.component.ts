import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UserWorkloadItem } from '@renwu/core';
import { WorkloadUserItemComponent } from './workload-user-item.component';

@Component({
  selector: 'renwu-timeline-workload-user-stat',
  standalone: true,
  templateUrl: './workload-user-stat.component.html',
  styleUrl: './workload-user-stat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorkloadUserItemComponent],
})
export class WorkloadUserStatComponent {
  @Input() user: unknown;
  @Input() stat: unknown;
  @Input() items: UserWorkloadItem[] = [];
}

