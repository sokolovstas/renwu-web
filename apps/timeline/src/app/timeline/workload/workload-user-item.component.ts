import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UserWorkloadItem } from '@renwu/core';

@Component({
  selector: 'renwu-timeline-workload-user-item',
  standalone: true,
  templateUrl: './workload-user-item.component.html',
  styleUrl: './workload-user-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadUserItemComponent {
  @Input() item!: UserWorkloadItem;
}

