import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { IssueBounds, TimelineLink } from '../models/timeline-issue.model';
import { parseUtcLike, unixSeconds } from '../date-helpers';

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
  @Input() scale = 1;

  protected left = 0;
  protected width = 0;

  ngOnChanges(): void {
    if (!this.data || !this.dateStart || !this.scale) return;

    const a = parseUtcLike(
      this.data.issue.date_start || this.data.issue.date_start_calc,
    );
    const b = parseUtcLike(
      this.data.link.date_end || this.data.link.date_end_calc,
    );
    if (!a || !b) return;

    const dateStartUnix = unixSeconds(this.dateStart);
    const p1 = (unixSeconds(a) - dateStartUnix) / this.scale;
    const p2 = (unixSeconds(b) - dateStartUnix) / this.scale;
    this.left = Math.min(p1, p2);
    this.width = Math.abs(p2 - p1);
  }
}

