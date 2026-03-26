import moment from 'moment';
import { Issue } from '@renwu/core';

export interface IssueBounds {
  left: number;
  width: number;
  top: number;
  height: number;
  paddingTop: number;
  flagLogs: boolean;
}

export interface IssueViewState {
  selected: boolean;
  bounds: IssueBounds | null;
  showChilds: boolean;
  closed: boolean;
  index: number;
  countGroupBefore: number;
}

/**
 * Timeline tree node used by the migrated UI.
 * It intentionally does not over-extend `Issue` with extra runtime callbacks.
 */
export type TimelineIssue = Omit<Issue, 'type' | 'childs'> & {
  type?: unknown;
  childs?: TimelineIssue[];
  _SHOWCHILDS?: boolean;
};

export interface IssueTreeRoot {
  id?: string | null;
  type: 'root';
  childs: TimelineIssue[];
  _SHOWCHILDS: boolean;
  date_start_calc?: moment.Moment;
  date_end_calc?: moment.Moment;
}

export type TimelineLinkType = 'before' | 'after';

export interface TimelineLink {
  issue: TimelineIssue; // the "target" node in the old UI naming
  link: TimelineIssue; // the "linked" node in the old UI naming
  type: TimelineLinkType;
}

