import { Injectable } from '@angular/core';
import { Issue, IssueGroup } from '../issue/issue.model';
import { isValid } from 'date-fns';

export type TimelineLinkType = 'before' | 'after';

export interface TimelineParsedLink {
  issue: Issue;
  link: Issue;
  type: TimelineLinkType;
}

export interface TimelineNodeIndexInfo {
  index: number;
  countGroupBefore: number;
  closed: boolean;
}

export interface TimelineTreeNode {
  id?: string | null;
  type?: unknown;
  _SHOWCHILDS?: boolean;
  childs?: TimelineTreeNode[];
}

export type TimelineNodeIndexMap = Record<string, TimelineNodeIndexInfo>;

type TimelineIssueNodeLike = Pick<
  Issue,
  | 'id'
  | 'type'
  | 'date_start'
  | 'date_end'
  | 'date_start_calc'
  | 'date_end_calc'
  | 'time_logs'
  | 'childs'
  | 'links'
> & {
  childs?: TimelineIssueNodeLike[];
};

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  calcMinMaxDate(
    groups: IssueGroup[],
    userTimeZone: string,
  ): {
    dateStart: Date;
    dateEnd: Date;
    issuesMap: Record<string, Issue>;
  } {
    const MAX_DATE = 0;
    const MIN_DATE = 99999999999999;

    const unixSeconds = (date: Date): number =>
      Math.floor(date.getTime() / 1000);

    const parseMomentLocal = (value: string | undefined): Date | null => {
      if (!value) return null;
      let d: Date;
      const trimmed = value.trim();
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        const ms = num < 1e10 ? num * 1000 : num;
        d = new Date(ms);
      } else {
        d = new Date(value);
      }
      if (!isValid(d) || d.getFullYear() < 1970) return null;
      return d;
    };

    const utcStartOfPrevMonth = (date: Date): Date => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    };

    const utcEndOfNextMonth = (date: Date): Date => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      // endOf month for (month + 1) in UTC = day 0 of (month + 2)
      return new Date(Date.UTC(year, month + 2, 0, 23, 59, 59, 999));
    };

    // The timezone plugin isn't available in this workspace build, so we currently
    // keep calculations in UTC. The timezone argument will be used once the
    // timezone plugin is introduced.
    void userTimeZone;

    let maxDate = MAX_DATE;
    let minDate = MIN_DATE;

    const issuesMap: Record<string, Issue> = {};

    const findMin = (node: TimelineIssueNodeLike): void => {
      if (!node.childs) {
        return;
      }

      for (const child of node.childs) {
        // In the migrated UI tree, synthetic "group" nodes use `type: 'group'`.
        // Real issue nodes may use a different enum type, so compare as runtime string.
        if (String(child.type) !== 'group') {
          if (child.id) {
            issuesMap[String(child.id)] = child as unknown as Issue;
          }

          const start = parseMomentLocal(child.date_start_calc);
          const end = parseMomentLocal(child.date_end_calc);

          if (start) {
            const unix = unixSeconds(start);
            if (unix > 0) minDate = Math.min(minDate, unix);
          }
          if (end) {
            const unix = unixSeconds(end);
            if (unix > 0) maxDate = Math.max(maxDate, unix);
          }

          if (child.time_logs) {
            for (const log of child.time_logs) {
              if (!log.date_created) continue;
              const created = parseMomentLocal(log.date_created);
              if (!created) continue;
              const unix = unixSeconds(created);
              if (unix > 0) minDate = Math.min(minDate, unix);
            }
          }
        }

        findMin(child);
      }
    };

    for (const group of groups) {
      findMin({ childs: group.issues as unknown as TimelineIssueNodeLike[] });
    }

    const dateStartBase = minDate === MIN_DATE ? new Date() : new Date(minDate * 1000);
    const dateEndBase = maxDate === MAX_DATE ? new Date() : new Date(maxDate * 1000);

    const dateStart = utcStartOfPrevMonth(dateStartBase);
    const dateEnd = utcEndOfNextMonth(dateEndBase);

    return { dateStart, dateEnd, issuesMap };
  }

  parseLinks(
    rows: TimelineIssueNodeLike[],
    issuesMap: Record<string, Issue>,
  ): TimelineParsedLink[] {
    const links: TimelineParsedLink[] = [];

    const traverse = (childRows: TimelineIssueNodeLike[]): void => {
      for (const row of childRows) {
        const rowLinks = row.links as Issue['links'] | undefined;

        if (rowLinks?.prev_issue?.length) {
          for (const prev of rowLinks.prev_issue) {
            const linked = issuesMap[prev.id];
            const issue = row as unknown as Issue;
            if (linked && issue) {
              links.push({ issue, link: linked, type: 'after' });
            }
          }
        }

        if (rowLinks?.next_issue?.length) {
          for (const next of rowLinks.next_issue) {
            const linked = issuesMap[next.id];
            const issue = row as unknown as Issue;
            if (linked && issue) {
              links.push({ issue, link: linked, type: 'before' });
            }
          }
        }

        if (row.childs?.length) {
          traverse(row.childs);
        }
      }
    };

    traverse(rows);

    return links;
  }

  recalculateIndexes(rootChild: TimelineTreeNode): TimelineNodeIndexMap {
    let counter = 0;
    const indexes: TimelineNodeIndexMap = {};

    const setIndex = (
      node: TimelineTreeNode,
      reset: boolean,
      closed: boolean,
      countGroupBeforeStart: number,
    ): void => {
      if (!node.childs) {
        return;
      }

      let countGroupBefore = countGroupBeforeStart;

      for (const child of node.childs) {
        if (child.id) {
          const id = String(child.id);
          indexes[id] = {
            index: reset ? counter - 1 : counter,
            countGroupBefore,
            closed,
          };
        }

        if (!reset) {
          counter++;
        }

        if (child.type === 'group') {
          countGroupBefore++;
        }

        const hasChilds = Boolean(child.childs && child.childs.length > 0);
        const closedChilds =
          closed || (!child._SHOWCHILDS && hasChilds);

        if (child._SHOWCHILDS && !reset) {
          setIndex(child, false, closedChilds, countGroupBefore);
        } else {
          setIndex(child, true, closedChilds, countGroupBefore);
        }
      }
    };

    setIndex(rootChild, false, false, -1);
    return indexes;
  }
}
