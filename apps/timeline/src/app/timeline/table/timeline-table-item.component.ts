import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  IssueTypeComponent,
  IssueStatusComponent,
  IssueAssigneesComponent,
  Type,
  Status,
} from '@renwu/core';
import { TimelineIssue } from '../models/timeline-issue.model';
import { visibleRowsBeforeChild } from '../row-striping';
import { TimelineSettingsService } from '../services/timeline-settings.service';

/** Align with `.td-assignee` + `.td-col` padding in `timeline-table-item.component.scss`. */
const ASSIGNEE_COL_WIDTH_PX = 120;
const TD_COL_HORIZONTAL_PADDING_PX = 8;
const ASSIGNEE_AVATAR_INSET_PX = 8;

function assigneeAvatarSizeFromRowHeightPx(rowHeightPx: number): string {
  const inner = ASSIGNEE_COL_WIDTH_PX - TD_COL_HORIZONTAL_PADDING_PX;
  const fromWidth = inner - ASSIGNEE_AVATAR_INSET_PX;
  const fromRow = Math.max(1, rowHeightPx - ASSIGNEE_AVATAR_INSET_PX);
  return `${Math.min(fromWidth, fromRow)}px`;
}

@Component({
  selector: 'renwu-timeline-table-item',
  standalone: true,
  templateUrl: './timeline-table-item.component.html',
  styleUrl: './timeline-table-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TimelineTableItemComponent,
    IssueTypeComponent,
    IssueStatusComponent,
    IssueAssigneesComponent,
  ],
})
export class TimelineTableItemComponent {
  private settingsService = inject(TimelineSettingsService);

  /** Same source as table/graph row height (`TimelineSettings.issueRowHeightPx`). */
  issueRowHeightPx = input.required<number>();

  /** From `TimelineSettings.fontSize` — derived from row height when settings load / persist. */
  tableFontSizePx = input.required<number>();

  @Input() item!: TimelineIssue;
  /** DFS index among visible rows (for alternating striping with the graph column). */
  @Input() stripeIndex = 0;
  /** When set, row with this issue id is highlighted (sync with graph hover). */
  @Input() highlightedId: string | null = null;
  @Input() depth = 0;
  @Input() tableWidth = 380;
  @Input() disableSelectedTimelineItem = false;

  @Output() selected = new EventEmitter<TimelineIssue>();
  @Output() scrollTo = new EventEmitter<TimelineIssue>();
  @Output() expanded = new EventEmitter<TimelineIssue>();

  protected readonly isGroup = computed(
    () => String(this.item?.type) === 'group',
  );
  protected readonly isRoot = computed(
    () => String(this.item?.type) === 'root',
  );

  /** Square avatar edge: column inner width minus 4px, capped by row height minus 4px. */
  protected readonly assigneeAvatarSize = computed(() =>
    assigneeAvatarSizeFromRowHeightPx(this.issueRowHeightPx()),
  );

  get typeInfo(): Type | null {
    const t = this.item?.type;
    if (!t || typeof t !== 'object') return null;
    return t as Type;
  }

  get statusInfo(): Status | null {
    return (this.item?.status as Status) ?? null;
  }

  protected childStripeIndex(childIndex: number): number {
    return this.stripeIndex + 1 + visibleRowsBeforeChild(this.item, childIndex);
  }

  get rowHighlighted(): boolean {
    const id = this.item?.id;
    if (id === undefined || id === null || id === '') return false;
    return String(id) === this.highlightedId;
  }

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
      this.settingsService.setOpenGroupIndex(
        this.item.id ?? this.item.title ?? 'group',
        opened,
      );
    } else if (this.item.id) {
      this.settingsService.setOpenIndex(this.item.id, opened);
    }
    this.expanded.emit(this.item);
  }
}
