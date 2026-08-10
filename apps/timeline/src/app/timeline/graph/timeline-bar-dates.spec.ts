import {
  timelineIssueBarEnd,
  timelineIssueBarStart,
} from './timeline-bar-dates';

describe('timelineIssueBarStart/End', () => {
  it('uses date_start_progress for in-progress issues', () => {
    const start = timelineIssueBarStart({
      status: { in_progress: true },
      date_start: '2026-07-20T09:00:00.000Z',
      date_start_progress: '2026-07-28T12:10:28.720Z',
      date_start_calc: '2026-08-04T09:00:00.000Z',
      date_end_calc: '2026-08-05T17:00:00.000Z',
    });
    expect(start?.toISOString()).toBe('2026-07-28T12:10:28.720Z');
  });

  it('falls back to date_start_calc when not in progress', () => {
    const start = timelineIssueBarStart({
      status: { in_progress: false },
      date_start: '2026-07-20T09:00:00.000Z',
      date_start_progress: '2026-07-28T12:10:28.720Z',
      date_start_calc: '2026-08-04T09:00:00.000Z',
      date_end_calc: '2026-08-05T17:00:00.000Z',
    });
    expect(start?.toISOString()).toBe('2026-08-04T09:00:00.000Z');
  });

  it('falls back to date_start_calc when progress start missing', () => {
    const start = timelineIssueBarStart({
      status: { in_progress: true },
      date_start_calc: '2026-08-04T09:00:00.000Z',
      date_end_calc: '2026-08-05T17:00:00.000Z',
    });
    expect(start?.toISOString()).toBe('2026-08-04T09:00:00.000Z');
  });

  it('clamps end to progress start when remaining plan ends earlier', () => {
    const end = timelineIssueBarEnd({
      status: { in_progress: true },
      date_start_progress: '2026-07-28T12:10:28.720Z',
      date_start_calc: '2026-08-04T09:00:00.000Z',
      date_end_calc: '2026-07-19T09:00:00.000Z',
    });
    expect(end?.toISOString()).toBe('2026-07-28T12:10:28.720Z');
  });
});
