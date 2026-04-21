import { IssueChangeEvent } from '@renwu/core';

/** Aligns legacy payload variants with what `IssueHistoryItemComponent` expects. */
export function normalizeTaskHistoryEvent(
  ev: IssueChangeEvent,
): IssueChangeEvent {
  const e = { ...ev } as Record<string, unknown>;
  if (e['id'] == null && e['_id'] != null) {
    e['id'] = String(e['_id']);
  }
  e['source'] = undefined;
  return e as unknown as IssueChangeEvent;
}

export function sortHistoryEventsNewestFirst(
  events: IssueChangeEvent[],
): IssueChangeEvent[] {
  return [...events]
    .map(normalizeTaskHistoryEvent)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
