import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Milestone } from '@renwu/core';
import { parseUtcLike } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';
import { milestoneSelectPayload } from './milestone-select-helpers';

@Component({
  selector: 'renwu-timeline-roadmap-item',
  standalone: true,
  templateUrl: './timeline-roadmap-item.component.html',
  styleUrl: './timeline-roadmap-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRoadmapItemComponent implements OnChanges {
  @Input() item!: Milestone;
  @Input() dateStart!: Date;
  @Input() scale = 1;
  @Input() hours24InDay = true;
  @Input() selectedMilestoneId: string | null = null;

  @Output()
  selectMilestone = new EventEmitter<{
    id: string;
    offset: number;
    due: boolean;
  } | null>();

  protected left = 0;
  protected width = 0;
  protected due = false;
  protected selected = false;

  ngOnChanges(): void {
    if (!this.item || !this.dateStart || !this.scale) {
      return;
    }
    const dateCalc = this.item.date_calc
      ? parseUtcLike(this.item.date_calc)
      : null;
    const date = this.item.date ? parseUtcLike(this.item.date) : null;

    const h24 = this.hours24InDay;
    const origin = unixSecondsVirtual(this.dateStart, h24, '');

    const calcOffset = dateCalc
      ? Math.floor(
          (unixSecondsVirtual(dateCalc, h24, '') - origin) / this.scale,
        )
      : 0;
    const dateOffset = date
      ? Math.floor((unixSecondsVirtual(date, h24, '') - origin) / this.scale)
      : calcOffset;

    this.due = calcOffset > dateOffset;
    this.left = Math.min(calcOffset, dateOffset);
    this.width = Math.abs(calcOffset - dateOffset);
    this.selected = this.selectedMilestoneId === this.item.id;
  }

  protected toggleSelect(): void {
    if (!this.item?.id) return;
    if (this.selected) {
      this.selectMilestone.emit(null);
      return;
    }
    const payload = milestoneSelectPayload(
      this.item,
      this.dateStart,
      this.scale,
      this.hours24InDay,
    );
    if (payload) this.selectMilestone.emit(payload);
  }
}

