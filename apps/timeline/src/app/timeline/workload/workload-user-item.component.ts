import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface WorkloadBar {
  position: number;
  width: number;
  total: number;
  capacity: number;
  ratio: number;
}

@Component({
  selector: 'renwu-timeline-workload-user-item',
  standalone: true,
  templateUrl: './workload-user-item.component.html',
  styleUrl: './workload-user-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadUserItemComponent {
  @Input() bar!: WorkloadBar;

  get barColorClass(): string {
    if (!this.bar) return 'bar-empty';
    if (this.bar.ratio > 1) return 'bar-overload';
    if (this.bar.ratio > 0.8) return 'bar-high';
    if (this.bar.ratio > 0.5) return 'bar-medium';
    return 'bar-low';
  }

  get label(): string {
    if (!this.bar) return '';
    return `${Math.round(this.bar.total)}/${Math.round(this.bar.capacity)}`;
  }
}
