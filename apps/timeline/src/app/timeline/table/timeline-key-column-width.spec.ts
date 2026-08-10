import {
  collectTimelineIssueKeys,
  measureTimelineKeyColumnWidthPx,
} from './timeline-key-column-width';
import { TimelineIssue } from '../models/timeline-issue.model';

describe('collectTimelineIssueKeys', () => {
  it('walks nested issues and skips groups', () => {
    const roots: TimelineIssue[] = [
      {
        id: 'g1',
        type: 'group',
        key: 'GROUP',
        title: 'Group',
        childs: [
          { id: '1', key: 'ABC-1', title: 'a' },
          {
            id: '2',
            key: 'LONGPROJECT-999',
            title: 'b',
            childs: [{ id: '3', key: 'ABC-2', title: 'c' }],
          },
        ],
      },
    ];
    expect(collectTimelineIssueKeys(roots)).toEqual([
      'ABC-1',
      'LONGPROJECT-999',
      'ABC-2',
    ]);
  });
});

describe('measureTimelineKeyColumnWidthPx', () => {
  it('grows with longer keys', () => {
    const short = measureTimelineKeyColumnWidthPx(['A-1'], 12);
    const long = measureTimelineKeyColumnWidthPx(['VERYLONGPROJECT-12345'], 12);
    expect(long).toBeGreaterThan(short);
  });

  it('respects a minimum width', () => {
    expect(measureTimelineKeyColumnWidthPx(['A'], 12)).toBeGreaterThanOrEqual(
      48,
    );
  });
});
