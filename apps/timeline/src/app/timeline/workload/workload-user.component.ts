import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'renwu-timeline-workload-user',
  standalone: true,
  templateUrl: './workload-user.component.html',
  styleUrl: './workload-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadUserComponent {
  @Input() user: unknown;
  @Input() workload: unknown;
}

