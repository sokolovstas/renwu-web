import { Issue, IssueLink } from '@renwu/core';

/** Lightweight parent link for API payloads (no empty dates, no UI-only fields). */
export function parentIssueToLink(issue: Issue): IssueLink {
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
