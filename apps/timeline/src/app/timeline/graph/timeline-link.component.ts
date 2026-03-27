import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { IssueBounds, TimelineLink } from '../models/timeline-issue.model';
import { parseUtcLike, unixSeconds } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';

@Component({
  selector: 'renwu-timeline-link',
  standalone: true,
  templateUrl: './timeline-link.component.html',
  styleUrl: './timeline-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineLinkComponent implements OnChanges {
  @Input() data!: TimelineLink;
  @Input() issueBounds: IssueBounds | null = null;
  @Input() linkBounds: IssueBounds | null = null;
  @Input() dateStart!: Date;
  @Input() hours24InDay = true;
  @Input() scale = 1;

  protected left = 0;
  protected width = 0;

  ngOnChanges(): void {
    if (!this.data || !this.dateStart || !this.scale) return;

    const a = parseUtcLike(this.data.issue.date_start_calc);
    const b = parseUtcLike(this.data.link.date_end_calc);
    if (!a || !b) return;

    const h24 = this.hours24InDay;
    const origin = unixSecondsVirtual(this.dateStart, h24, '');
    const p1 = (unixSecondsVirtual(a, h24, 'start') - origin) / this.scale;
    const p2 = (unixSecondsVirtual(b, h24, 'end') - origin) / this.scale;
    this.left = Math.min(p1, p2);
    this.width = Math.abs(p2 - p1);
  }
}

