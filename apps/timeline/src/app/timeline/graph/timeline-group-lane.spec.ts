import { TimelineIssue } from '../models/timeline-issue.model';
import { timelineGroupLaneBars } from './timeline-group-lane';

describe('timelineGroupLaneBars', () => {
  const dateStart = new Date('2026-01-01T00:00:00.000Z');
  const ctx = { dateStart, scale: 3600, hours24InDay: true };

  it('places every task of a group on one line by its dates', () => {
    const group: TimelineIssue = {
      id: 'assignee-1',
      type: 'group',
      title: 'Ada',
      childs: [
        {
          id: 'a',
          title: 'A',
          status: { color: '#112233' },
          date_start_calc: '2026-01-01T00:00:00.000Z',
          date_end_calc: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 'b',
          title: 'B',
          date_start_calc: '2026-01-03T00:00:00.000Z',
          date_end_calc: '2026-01-03T12:00:00.000Z',
        },
      ],
    };

    const bars = timelineGroupLaneBars(group, ctx);

    expect(bars.map((bar) => bar.id)).toEqual(['a', 'b']);
    expect(bars[0].left).toBe(0);
    expect(bars[0].width).toBe(24);
    expect(bars[0].color).toBe('#112233');
    expect(bars[1].left).toBe(48);
    expect(bars[1].width).toBe(12);
  });

  it('draws child tasks instead of a parent rollup bar', () => {
    const group: TimelineIssue = {
      id: 'status-open',
      type: 'group',
      title: 'Open',
      childs: [
        {
          id: 'parent',
          title: 'Parent',
          date_start_calc: '2026-01-01T00:00:00.000Z',
          date_end_calc: '2026-01-10T00:00:00.000Z',
          childs: [
            {
              id: 'child',
              title: 'Child',
              date_start_calc: '2026-01-02T00:00:00.000Z',
              date_end_calc: '2026-01-03T00:00:00.000Z',
            },
          ],
        },
      ],
    };

    const bars = timelineGroupLaneBars(group, ctx);

    expect(bars.map((bar) => bar.id)).toEqual(['child']);
  });

  it('keeps a parent bar when descendants have no dates', () => {
    const group: TimelineIssue = {
      id: 'g',
      type: 'group',
      childs: [
        {
          id: 'parent',
          title: 'Parent',
          date_start_calc: '2026-01-01T00:00:00.000Z',
          date_end_calc: '2026-01-02T00:00:00.000Z',
          childs: [{ id: 'child', title: 'Child' }],
        },
      ],
    };

    expect(timelineGroupLaneBars(group, ctx).map((bar) => bar.id)).toEqual([
      'parent',
    ]);
  });
});
