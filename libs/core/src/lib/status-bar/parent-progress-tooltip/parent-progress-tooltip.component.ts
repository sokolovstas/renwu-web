import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwDurationToStringPipe } from '@renwu/components';

@Component({
  templateUrl: './parent-progress-tooltip.component.html',
  standalone: true,
  imports: [RwDurationToStringPipe, TranslocoPipe],
  styleUrl: './parent-progress-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentProgressTooltipComponent {
  @Input()
  data = {
    issueTotal: 0,
    issueResolved: 0,
    estimatedTotal: 0,
    estimatedResolved: 0,
    estimateRemaining: 0,
    percents: 0,
  };
}
