import { parseUtcLike } from '../date-helpers';

type TimelineDated = {
  date_start?: string | Date | null;
  date_start_progress?: string | Date | null;
  date_start_calc?: string | Date | null;
  date_end_calc?: string | Date | null;
  status?: { in_progress?: boolean } | string | null;
};

function isInProgress(issue: TimelineDated): boolean {
  return (
    typeof issue.status === 'object' &&
    issue.status !== null &&
    Boolean(issue.status.in_progress)
  );
}

function asDateString(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

/** In-progress: date_start_progress; otherwise planned calc start. */
export function timelineIssueBarStart(issue: TimelineDated): Date | null {
  if (isInProgress(issue)) {
    return (
      parseUtcLike(asDateString(issue.date_start_progress)) ??
      parseUtcLike(asDateString(issue.date_start_calc))
    );
  }
  return parseUtcLike(asDateString(issue.date_start_calc));
}

/** Planned calc end; never earlier than bar start. */
export function timelineIssueBarEnd(issue: TimelineDated): Date | null {
  const start = timelineIssueBarStart(issue);
  const end = parseUtcLike(asDateString(issue.date_end_calc));
  if (!end) {
    return start;
  }
  if (start && end.getTime() < start.getTime()) {
    return start;
  }
  return end;
}
