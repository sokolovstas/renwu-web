import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { User, UserWorkload } from '@renwu/core';
import { WorkloadUserStatComponent } from './workload-user-stat.component';

@Component({
  selector: 'renwu-timeline-workload-user',
  standalone: true,
  templateUrl: './workload-user.component.html',
  styleUrl: './workload-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WorkloadUserStatComponent, TranslocoPipe],
})
export class WorkloadUserComponent {
  @Input() user: User | null = null;
  @Input() workload: UserWorkload | null = null;
}

