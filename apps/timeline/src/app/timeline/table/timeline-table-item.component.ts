import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { TimelineIssue } from '../models/timeline-issue.model';
import { TimelineSettingsService } from '../services/timeline-settings.service';

@Component({
  selector: 'renwu-timeline-table-item',
  standalone: true,
  templateUrl: './timeline-table-item.component.html',
  styleUrl: './timeline-table-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimelineTableItemComponent],
})
export class TimelineTableItemComponent {
  private settingsService = inject(TimelineSettingsService);

  @Input() item!: TimelineIssue;
  @Input() depth = 0;
  @Input() tableWidth = 280;
  @Input() disableSelectedTimelineItem = false;

  @Output() selected = new EventEmitter<TimelineIssue>();
  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() expanded = new EventEmitter<TimelineIssue>();

  protected readonly isGroup = computed(() => String(this.item?.type) === 'group');
  protected readonly isRoot = computed(() => String(this.item?.type) === 'root');

  protected onHover(inside: boolean): void {
    if (this.disableSelectedTimelineItem || !this.item?.id) return;
    this.selected.emit({ ...this.item, __selected: inside } as TimelineIssue);
  }

  protected onItemClick(): void {
    this.scrollTo.emit(this.item);
  }

  protected toggleExpand(): void {
    if (!this.item) return;
    const opened = !(this.item._SHOWCHILDS ?? true);
    this.item._SHOWCHILDS = opened;

    if (this.isGroup()) {
      this.settingsService.setOpenGroupIndex(this.item.id ?? this.item.title ?? 'group', opened);
    } else if (this.item.id) {
      this.settingsService.setOpenIndex(this.item.id, opened);
    }
    this.expanded.emit(this.item);
  }
}

