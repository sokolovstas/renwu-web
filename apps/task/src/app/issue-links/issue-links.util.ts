import { Issue, IssueLink, IssueLinks } from '@renwu/core';

export const ISSUE_LINK_BUCKETS = [
  'parent',
  'prev_issue',
  'next_issue',
  'related',
] as const;

export type IssueLinkBucket = (typeof ISSUE_LINK_BUCKETS)[number];

export function issueToIssueLink(issue: Issue): IssueLink {
  return {
    id: String(issue.id),
    title: issue.title ?? '',
    key: issue.key ?? '',
    have_childs: issue.have_childs ?? false,
    date_start: issue.date_start ?? '',
    date_end: issue.date_end ?? '',
    status: issue.status,
  };
}

/** True if `key` appears in any of the four link arrays on the issue form. */
export function isIssueKeyInAnyLinkBucket(
  key: string,
  links: IssueLinks | null | undefined,
): boolean {
  if (!links) {
    return false;
  }
  for (const bucket of ISSUE_LINK_BUCKETS) {
    const arr = links[bucket] ?? [];
    if (arr.some((r) => r.key === key)) {
      return true;
    }
  }
  return false;
}

/** All issue keys already present in structural + related link buckets (for search filtering). */
export function collectLinkedIssueKeys(
  links: IssueLinks | null | undefined,
): string[] {
  if (!links) {
    return [];
  }
  const out = new Set<string>();
  for (const bucket of ISSUE_LINK_BUCKETS) {
    for (const l of links[bucket] ?? []) {
      const k = (l.key ?? '').trim();
      if (k) {
        out.add(k);
      }
    }
  }
  return [...out];
}
