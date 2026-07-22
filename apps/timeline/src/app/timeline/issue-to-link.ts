import { Issue, IssueLink } from '@renwu/core';
import { TimelineIssue } from './models/timeline-issue.model';

/** Lightweight issue link for create-template / save payloads. */
export function timelineIssueToLink(issue: TimelineIssue | Issue): IssueLink {
  const out = {
    id: String(issue.id),
    title: issue.title ?? '',
    key: issue.key ?? '',
    have_childs: issue.have_childs ?? false,
  } as IssueLink;
  const dateStart = (issue.date_start ?? '').trim();
  const dateEnd = (issue.date_end ?? '').trim();
  if (dateStart) {
    out.date_start = dateStart;
  }
  if (dateEnd) {
    out.date_end = dateEnd;
  }
  return out;
}

export type TimelineCreateDirection = 'prev' | 'next' | 'parent' | 'child';
