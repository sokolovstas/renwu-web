import { IssueChangeEvent } from '@renwu/core';

import {
  normalizeTaskHistoryEvent,
  sortHistoryEventsNewestFirst,
} from './history.utils';

describe('history.utils', () => {
  describe('normalizeTaskHistoryEvent', () => {
    it('copies _id to id when id is missing', () => {
      const ev = {
        _id: 'abc123',
        date: '2020-01-02',
      } as unknown as IssueChangeEvent;
      const out = normalizeTaskHistoryEvent(ev);
      expect(out.id).toBe('abc123');
    });

    it('does not overwrite existing id', () => {
      const ev = {
        id: 'keep',
        _id: 'other',
        date: '2020-01-02',
      } as unknown as IssueChangeEvent;
      const out = normalizeTaskHistoryEvent(ev);
      expect(out.id).toBe('keep');
    });

    it('clears source for downstream renderer', () => {
      const ev = {
        id: '1',
        source: 'legacy',
        date: '2020-01-02',
      } as unknown as IssueChangeEvent;
      const out = normalizeTaskHistoryEvent(ev);
      expect((out as { source?: string }).source).toBeUndefined();
    });
  });

  describe('sortHistoryEventsNewestFirst', () => {
    it('sorts by date descending', () => {
      const a: IssueChangeEvent = {
        id: 'a',
        date: '2020-01-01T10:00:00.000Z',
      } as IssueChangeEvent;
      const b: IssueChangeEvent = {
        id: 'b',
        date: '2020-01-03T10:00:00.000Z',
      } as IssueChangeEvent;
      const c: IssueChangeEvent = {
        id: 'c',
        date: '2020-01-02T10:00:00.000Z',
      } as IssueChangeEvent;
      const sorted = sortHistoryEventsNewestFirst([a, b, c]);
      expect(sorted.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    });
  });
});
