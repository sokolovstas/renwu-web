import { ListOptionsFilters, TimelineScaleTick, TimelineTicksId } from '@renwu/core';

export interface TimelineSettings {
  fontSize: number;
  grouping: string;

  scaleTick: TimelineTicksId;
  scale: number;
  oldScale: number;
  scaleValue: number;

  tableWidth: number;
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

