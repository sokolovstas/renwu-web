import { Issue, IssueLinks } from '@renwu/core';

export type TaskSectionCounts = Record<string, number>;

/** Loose form/issue snapshot — only lengths and link arrays are read. */
export type TaskSectionCountSource = {
  todos?: readonly unknown[] | null;
  attachments?: readonly unknown[] | null;
  time_logs?: readonly unknown[] | null;
  links?: IssueLinks | null;
  childs?: readonly unknown[] | null;
  childs_total?: number | null;
};

function linkCount(
  links: IssueLinks | null | undefined,
  keys: (keyof IssueLinks)[],
): number {
  if (!links) {
    return 0;
  }
  return keys.reduce((sum, key) => sum + (links[key]?.length ?? 0), 0);
}

/**
 * Badge counts for section tabs. Returns 0 when empty (badge hidden).
 * Description / history have no stable numeric source on the form → always 0.
 *
 * `loadedChildsTotal` comes from GET /issue/:id/childs — the issue payload often
 * has childs_total=0 because it is not persisted (bson:"-").
 */
export function computeTaskSectionCounts(
  formValue: TaskSectionCountSource | null | undefined,
  issue: Issue | null | undefined,
  pendingSubtasks = 0,
  loadedChildsTotal?: number | null,
): TaskSectionCounts {
  const links = formValue?.links ?? issue?.links;
  const todos = formValue?.todos ?? issue?.todos;
  const attachments = formValue?.attachments ?? issue?.attachments;
  const timeLogs = formValue?.time_logs ?? issue?.time_logs;
  const fromIssue =
    issue?.childs_total && issue.childs_total > 0
      ? issue.childs_total
      : issue?.childs?.length && issue.childs.length > 0
        ? issue.childs.length
        : 0;
  const childsTotal =
    (loadedChildsTotal != null && loadedChildsTotal > 0
      ? loadedChildsTotal
      : 0) ||
    fromIssue ||
    (pendingSubtasks > 0 ? pendingSubtasks : 0);

  return {
    'renwu-task-description': 0,
    'renwu-task-todo': todos?.length ?? 0,
    'renwu-task-links': linkCount(links, [
      'parent',
      'prev_issue',
      'next_issue',
    ]),
    'renwu-task-related': linkCount(links, ['related']),
    'renwu-task-sub-task': childsTotal,
    'renwu-task-attachments': attachments?.length ?? 0,
    'renwu-task-time-log': timeLogs?.length ?? 0,
    'renwu-task-history': 0,
  };
}
