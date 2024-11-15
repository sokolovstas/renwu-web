
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RwTooltipDirective } from '@renwu/components';
import { Priority } from '../../../settings/dictionary.model';

@Component({
  selector: 'renwu-issue-priority',
  standalone: true,
  imports: [RwTooltipDirective],
  templateUrl: './priority.component.html',
  styleUrl: './priority.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuePriorityComponent {
  @Input()
  value: Priority;

  @Input()
  withLabel: boolean;

  @Input()
  tooltipDisabled: boolean;
}
