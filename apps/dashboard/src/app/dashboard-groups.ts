import { Issue } from '@renwu/core';
import { parseUtcLike } from '@renwu/utils';
import {
  endOfDay,
  endOfWeek,
  format,
  isBefore,
  startOfDay,
  startOfWeek,
} from 'date-fns';

export type DashboardGroupKind =
  | 'all'
  | 'overdue'
  | 'today'
  | 'week'
  | 'day'
  | 'undated';

export interface DashboardIssueGroup {
  id: string;
  kind: DashboardGroupKind;
  date?: Date;
  issues: Issue[];
}

export type IssueScheduleClass =
  | { kind: 'overdue' | 'today' | 'week' | 'undated' }
  | { kind: 'later'; date: Date };

const WEEK_OPTS = { weekStartsOn: 1 as const };

function issueInstant(value: string | undefined): Date | null {
  return parseUtcLike(value);
}

export function issueScheduleRange(issue: Issue): {
  start: Date | null;
  end: Date | null;
} {
  const start =
    issueInstant(issue.date_start_calc) || issueInstant(issue.date_start);
  const end = issueInstant(issue.date_end_calc) || issueInstant(issue.date_end);
  return { start, end };
}

function sortByStart(a: Issue, b: Issue): number {
  const ra = issueScheduleRange(a);
  const rb = issueScheduleRange(b);
  const sa = (ra.start || ra.end)?.getTime() ?? Number.POSITIVE_INFINITY;
  const sb = (rb.start || rb.end)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (sa !== sb) {
    return sa - sb;
  }
  return (a.title || '').localeCompare(b.title || '');
}

function dayId(date: Date): string {
  return `day:${format(date, 'yyyy-MM-dd')}`;
}

/**
 * Classify an open issue for the morning dashboard.
 * - overdue: has an end date before today
 * - today: overlaps today, or already started with no end
 * - week: overlaps this week (Mon–Sun) but not today
 * - later: after this week (grouped by start day)
 * - undated: no usable dates
 */
export function classifyIssueSchedule(
  issue: Issue,
  now: Date,
): IssueScheduleClass {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, WEEK_OPTS);
  const weekEnd = endOfWeek(now, WEEK_OPTS);
  const { start, end } = issueScheduleRange(issue);

  if (!start && !end) {
    return { kind: 'undated' };
  }

  const s = start ?? end;
  const e = end ?? start;

  if (end && isBefore(end, todayStart)) {
    return { kind: 'overdue' };
  }

  if (s <= todayEnd && e >= todayStart) {
    return { kind: 'today' };
  }
  if (!end && start && start <= todayEnd) {
    return { kind: 'today' };
  }

  if (s <= weekEnd && e >= weekStart) {
    return { kind: 'week' };
  }
  if (!end && start && start <= weekEnd) {
    return { kind: 'week' };
  }

  return { kind: 'later', date: startOfDay(s) };
}

export function groupIssues(
  issues: Issue[] | null | undefined,
  groupBy: 'none' | 'schedule' | 'day',
  now: Date = new Date(),
): DashboardIssueGroup[] {
  const list = [...(issues || [])].sort(sortByStart);
  if (!list.length) {
    return [];
  }
  if (groupBy === 'none') {
    return [{ id: 'all', kind: 'all', issues: list }];
  }

  if (groupBy === 'day') {
    const days = new Map<string, DashboardIssueGroup>();
    const undated: Issue[] = [];
    for (const issue of list) {
      const { start, end } = issueScheduleRange(issue);
      const s = start ?? end;
      if (!s) {
        undated.push(issue);
        continue;
      }
      const date = startOfDay(s);
      const id = dayId(date);
      const group = days.get(id);
      if (group) {
        group.issues.push(issue);
      } else {
        days.set(id, { id, kind: 'day', date, issues: [issue] });
      }
    }
    const ordered = [...days.values()].sort(
      (a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0),
    );
    if (undated.length) {
      ordered.push({ id: 'undated', kind: 'undated', issues: undated });
    }
    return ordered;
  }

  const overdue: Issue[] = [];
  const today: Issue[] = [];
  const week: Issue[] = [];
  const later = new Map<string, DashboardIssueGroup>();
  const undated: Issue[] = [];

  for (const issue of list) {
    const classified = classifyIssueSchedule(issue, now);
    if (classified.kind === 'overdue') {
      overdue.push(issue);
      continue;
    }
    if (classified.kind === 'today') {
      today.push(issue);
      continue;
    }
    if (classified.kind === 'week') {
      week.push(issue);
      continue;
    }
    if (classified.kind === 'undated') {
      undated.push(issue);
      continue;
    }
    if (classified.kind !== 'later') {
      continue;
    }
    const id = dayId(classified.date);
    const group = later.get(id);
    if (group) {
      group.issues.push(issue);
    } else {
      later.set(id, {
        id,
        kind: 'day',
        date: classified.date,
        issues: [issue],
      });
    }
  }

  const groups: DashboardIssueGroup[] = [];
  if (overdue.length) {
    groups.push({ id: 'overdue', kind: 'overdue', issues: overdue });
  }
  if (today.length) {
    groups.push({ id: 'today', kind: 'today', issues: today });
  }
  if (week.length) {
    groups.push({ id: 'week', kind: 'week', issues: week });
  }
  groups.push(
    ...[...later.values()].sort(
      (a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0),
    ),
  );
  if (undated.length) {
    groups.push({ id: 'undated', kind: 'undated', issues: undated });
  }
  return groups;
}
