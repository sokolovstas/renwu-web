
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RwTooltipDirective } from '@renwu/components';
import { Type } from '../../../settings/dictionary.model';

@Component({
  selector: 'renwu-issue-type',
  standalone: true,
  imports: [RwTooltipDirective],
  templateUrl: './type.component.html',
  styleUrl: './type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueTypeComponent {
  @Input()
  value: Type;

  @Input()
  withLabel: boolean;

  @Input()
  tooltipDisabled: boolean;
}
