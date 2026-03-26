import { Injectable } from '@angular/core';
import moment from 'moment';
import { Issue, IssueGroup } from '../issue/issue.model';

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
    dateStart: moment.Moment;
    dateEnd: moment.Moment;
    issuesMap: Record<string, Issue>;
  } {
    const MAX_DATE = 0;
    const MIN_DATE = 99999999999999;

    // `moment-timezone` isn't available in this workspace build, so we currently
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

          const momentStart = moment(child.date_start || child.date_start_calc);
          const momentEnd = moment(child.date_end || child.date_end_calc);

          if (momentStart.isValid() && momentStart.unix() > 0) {
            minDate = Math.min(minDate, momentStart.unix());
          }
          if (momentEnd.isValid() && momentEnd.unix() > 0) {
            maxDate = Math.max(maxDate, momentEnd.unix());
          }

          if (child.time_logs) {
            for (const log of child.time_logs) {
              if (!log.date_created) continue;
              const momentCreated = moment(log.date_created);
              if (
                momentCreated.isValid() &&
                momentCreated.unix() > 0
              ) {
                minDate = Math.min(minDate, momentCreated.unix());
              }
            }
          }
        }

        findMin(child);
      }
    };

    for (const group of groups) {
      findMin({ childs: group.issues as unknown as TimelineIssueNodeLike[] });
    }

    const dateStart =
      minDate === MIN_DATE
        ? moment.utc()
        : moment.unix(minDate).utc();

    const dateEnd =
      maxDate === MAX_DATE
        ? moment.utc()
        : moment.unix(maxDate).utc();

    dateStart.subtract(1, 'M').startOf('M');
    dateEnd.add(1, 'M').endOf('M');

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
