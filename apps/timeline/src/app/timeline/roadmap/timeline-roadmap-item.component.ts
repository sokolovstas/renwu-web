import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Milestone } from '@renwu/core';
import {
  milestoneBarGeometry,
  milestoneSelectPayload,
} from './milestone-select-helpers';

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
  protected plannedPx = 0;
  protected actualPx = 0;
  protected linkLeftPx = 0;
  protected linkWidthPx = 0;
  protected due = false;
  protected selected = false;

  ngOnChanges(): void {
    if (!this.item || !this.dateStart || !this.scale) {
      return;
    }
    const g = milestoneBarGeometry(
      this.item,
      this.dateStart,
      this.scale,
      this.hours24InDay,
    );
    if (g) {
      this.due = g.due;
      this.plannedPx = g.plannedPx;
      this.actualPx = g.actualPx;
      this.linkLeftPx = g.leftPx;
      this.linkWidthPx = g.linkWidthPx;
    } else {
      this.due = false;
      this.plannedPx = 0;
      this.actualPx = 0;
      this.linkLeftPx = 0;
      this.linkWidthPx = 0;
    }
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

