import { ListOptionsFilters, TimelineScaleTick, TimelineTicksId } from '@renwu/core';

export interface TimelineSettings {
  fontSize: number;
  grouping: string;

  scaleTick: TimelineTicksId;
  scale: number;
  oldScale: number;
  scaleValue: number;

  tableWidth: number;
  /** Issue / graph row height in px (also drives `--timeline-issue-row-height`). */
  issueRowHeightPx: number;
  /** One horizontal track for a milestone bar in the roadmap strip. */
  milestoneRowHeightPx: number;
  showMilestones: boolean;
  showWorkforce: boolean;
  showTitleInside: boolean;
  showTitleRight: boolean;

  workforceHeight: { id: string; value: number } | null;

  sort: ListOptionsFilters['sort'];

  open_index: Record<string, boolean>;
  open_index_group: Record<string, boolean>;

  ticks: TimelineScaleTick[];
}

