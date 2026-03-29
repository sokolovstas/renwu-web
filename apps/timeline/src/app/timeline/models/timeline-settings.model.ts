import { ListOptionsFilters, TimelineScaleTick, TimelineTicksId } from '@renwu/core';

export interface TimelineSettings {
  /** Table row label font (px); derived from `issueRowHeightPx` in code — not persisted. */
  fontSize: number;
  grouping: string;

  scaleTick: TimelineTicksId;
  scale: number;
  oldScale: number;
  scaleValue: number;

  tableWidth: number;
  /** Issue / graph row height (px); code default only — not persisted. */
  issueRowHeightPx: number;
  /** Roadmap milestone track height (px); code default only — not persisted. */
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

