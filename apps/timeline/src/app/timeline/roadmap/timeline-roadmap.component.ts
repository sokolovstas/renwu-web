import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Milestone } from '@renwu/core';
import { TimelineRoadmapItemComponent } from './timeline-roadmap-item.component';

@Component({
  selector: 'renwu-timeline-roadmap',
  standalone: true,
  templateUrl: './timeline-roadmap.component.html',
  styleUrl: './timeline-roadmap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimelineRoadmapItemComponent],
})
export class TimelineRoadmapComponent {
  @Input() items: Milestone[] = [];

  @Input() dateStart!: Date;
  @Input() scale = 1;
  @Input() hours24InDay = true;
  /** Height of each milestone track (row); from `TimelineSettings.milestoneRowHeightPx`. */
  @Input() rowHeightPx = 22;
  /** Horizontal width of the axis (same as ruler / graph content). */
  @Input() trackWidthPx = 0;

  @Input() selectedMilestoneId: string | null = null;

  @Output()
  selectedMilestoneChange = new EventEmitter<{
    id: string;
    offset: number;
    due: boolean;
  } | null>();

  protected onSelectMilestone(value: { id: string; offset: number; due: boolean } | null): void {
    this.selectedMilestoneChange.emit(value);
  }
}

