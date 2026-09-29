import { Issue } from '@renwu/core';
import {
  classifyIssueSchedule,
  groupIssues,
} from './dashboard-groups';

function issue(partial: Partial<Issue> & Pick<Issue, 'id' | 'title'>): Issue {
  return partial as Issue;
}

describe('classifyIssueSchedule', () => {
  // Thursday 20 Aug 2026 12:00 local
  const now = new Date(2026, 7, 20, 12, 0, 0);

  it('marks undated when calc dates are Go zero', () => {
    expect(
      classifyIssueSchedule(
        issue({
          id: '1',
          title: 'none',
          date_start_calc: '0001-01-01T00:00:00Z',
          date_end_calc: '0001-01-01T00:00:00Z',
        }),
        now,
      ),
    ).toEqual({ kind: 'undated' });
  });

  it('puts overlapping today in today', () => {
    expect(
      classifyIssueSchedule(
        issue({
          id: '1',
          title: 'today',
          date_start_calc: new Date(2026, 7, 20, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 20, 18, 0, 0).toISOString(),
        }),
        now,
      ).kind,
    ).toBe('today');
  });

  it('puts already-started open work in today', () => {
    expect(
      classifyIssueSchedule(
        issue({
          id: '1',
          title: 'started',
          date_start_calc: new Date(2026, 7, 18, 9, 0, 0).toISOString(),
        }),
        now,
      ).kind,
    ).toBe('today');
  });

  it('puts ended-before-today in overdue', () => {
    expect(
      classifyIssueSchedule(
        issue({
          id: '1',
          title: 'late',
          date_start_calc: new Date(2026, 7, 18, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 19, 18, 0, 0).toISOString(),
        }),
        now,
      ).kind,
    ).toBe('overdue');
  });

  it('puts later this week in week', () => {
    expect(
      classifyIssueSchedule(
        issue({
          id: '1',
          title: 'friday',
          date_start_calc: new Date(2026, 7, 21, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 21, 18, 0, 0).toISOString(),
        }),
        now,
      ).kind,
    ).toBe('week');
  });

  it('puts next week in later with that day', () => {
    const nextMon = new Date(2026, 7, 24, 9, 0, 0);
    const classified = classifyIssueSchedule(
      issue({
        id: '1',
        title: 'next',
        date_start_calc: nextMon.toISOString(),
        date_end_calc: new Date(2026, 7, 24, 18, 0, 0).toISOString(),
      }),
      now,
    );
    expect(classified.kind).toBe('later');
    if (classified.kind === 'later') {
      expect(classified.date.getFullYear()).toBe(2026);
      expect(classified.date.getMonth()).toBe(7);
      expect(classified.date.getDate()).toBe(24);
    }
  });
});

describe('groupIssues', () => {
  const now = new Date(2026, 7, 20, 12, 0, 0);

  it('returns a single group when groupBy is none', () => {
    const groups = groupIssues(
      [
        issue({ id: 'b', title: 'B' }),
        issue({ id: 'a', title: 'A' }),
      ],
      'none',
      now,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe('all');
    expect(groups[0].issues.map((i) => i.title)).toEqual(['A', 'B']);
  });

  it('orders schedule buckets overdue / today / week / later days / undated', () => {
    const groups = groupIssues(
      [
        issue({
          id: 'u',
          title: 'No date',
        }),
        issue({
          id: 'l',
          title: 'Next week',
          date_start_calc: new Date(2026, 7, 25, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 25, 18, 0, 0).toISOString(),
        }),
        issue({
          id: 't',
          title: 'Today',
          date_start_calc: new Date(2026, 7, 20, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 20, 18, 0, 0).toISOString(),
        }),
        issue({
          id: 'w',
          title: 'Friday',
          date_start_calc: new Date(2026, 7, 21, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 21, 18, 0, 0).toISOString(),
        }),
        issue({
          id: 'o',
          title: 'Overdue',
          date_start_calc: new Date(2026, 7, 18, 9, 0, 0).toISOString(),
          date_end_calc: new Date(2026, 7, 19, 18, 0, 0).toISOString(),
        }),
      ],
      'schedule',
      now,
    );
    expect(groups.map((g) => g.kind)).toEqual([
      'overdue',
      'today',
      'week',
      'day',
      'undated',
    ]);
    expect(groups[3].date?.getDate()).toBe(25);
  });

  it('groups by calendar day', () => {
    const groups = groupIssues(
      [
        issue({
          id: '2',
          title: 'Fri',
          date_start_calc: new Date(2026, 7, 21, 9, 0, 0).toISOString(),
        }),
        issue({
          id: '1',
          title: 'Thu',
          date_start_calc: new Date(2026, 7, 20, 9, 0, 0).toISOString(),
        }),
      ],
      'day',
      now,
    );
    expect(groups.map((g) => g.kind)).toEqual(['day', 'day']);
    expect(groups[0].date?.getDate()).toBe(20);
    expect(groups[1].date?.getDate()).toBe(21);
  });
});
