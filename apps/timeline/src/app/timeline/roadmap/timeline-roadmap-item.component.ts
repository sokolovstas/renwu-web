import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import moment from 'moment';
import { Milestone } from '@renwu/core';

@Component({
  selector: 'renwu-timeline-roadmap-item',
  standalone: true,
  templateUrl: './timeline-roadmap-item.component.html',
  styleUrl: './timeline-roadmap-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRoadmapItemComponent implements OnChanges {
  @Input() item!: Milestone;
  @Input() dateStart!: moment.Moment;
  @Input() scale = 1;
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
    const dateCalc = this.item.date_calc ? moment.utc(this.item.date_calc) : null;
    const date = this.item.date ? moment.utc(this.item.date) : null;

    const calcOffset = dateCalc
      ? Math.floor((dateCalc.unix() - this.dateStart.unix()) / this.scale)
      : 0;
    const dateOffset = date
      ? Math.floor((date.unix() - this.dateStart.unix()) / this.scale)
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
    this.selectMilestone.emit({
      id: this.item.id,
      offset: this.due ? this.left + this.width : this.left,
      due: this.due,
    });
  }
}

