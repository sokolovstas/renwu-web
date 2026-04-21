import { Issue, IssueLink } from '@renwu/core';

export function parentIssueToLink(issue: Issue): IssueLink {
  return {
    id: String(issue.id),
    title: issue.title ?? '',
    key: issue.key ?? '',
    have_childs: issue.have_childs ?? false,
    date_start: issue.date_start ?? '',
    date_end: issue.date_end ?? '',
    status: issue.status as Issue['status'],
  };
}
