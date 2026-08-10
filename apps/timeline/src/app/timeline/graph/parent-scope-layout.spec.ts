import { buildTimelineParentScopeLayouts } from './parent-scope-layout';
import { TimelineIssue } from '../models/timeline-issue.model';

describe('buildTimelineParentScopeLayouts', () => {
  const dateStart = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const scale = 86400; // 1 px per second => 1 day = 86400 px

  it('builds a scope box for an expanded parent with visible children', () => {
    const parent: TimelineIssue = {
      id: 'parent-1',
      title: 'Parent',
      type: { color: '#336699' },
      status: { color: '#112233' },
      date_start_calc: '2026-01-02T00:00:00.000Z',
      date_end_calc: '2026-01-10T00:00:00.000Z',
      _SHOWCHILDS: true,
      childs: [
        {
          id: 'child-1',
          title: 'Child',
          date_start_calc: '2026-01-03T00:00:00.000Z',
          date_end_calc: '2026-01-05T00:00:00.000Z',
        },
      ],
    };

    const layouts = buildTimelineParentScopeLayouts([parent], {
      dateStart,
      scale,
      hours24InDay: true,
      issueRowHeightPx: 37,
      roadmapBandHeightPx: 0,
    });

    expect(layouts).toHaveLength(1);
    expect(layouts[0].parentId).toBe('parent-1');
    expect(layouts[0].issueIds).toEqual(['parent-1', 'child-1']);
    expect(layouts[0].heightPx).toBe(37 * 2);
    expect(layouts[0].leftPx).toBeLessThan(layouts[0].leftPx + layouts[0].widthPx);
  });

  it('uses date_start_progress for scope bounds when in progress', () => {
    const parent: TimelineIssue = {
      id: 'parent-started',
      title: 'Parent',
      status: { in_progress: true },
      date_start_progress: '2026-01-01T00:00:00.000Z',
      date_start_calc: '2026-01-08T00:00:00.000Z',
      date_end_calc: '2026-01-10T00:00:00.000Z',
      _SHOWCHILDS: true,
      childs: [
        {
          id: 'child-started',
          title: 'Child',
          status: { in_progress: true },
          date_start_progress: '2026-01-01T00:00:00.000Z',
          date_start_calc: '2026-01-08T00:00:00.000Z',
          date_end_calc: '2026-01-05T00:00:00.000Z',
        },
      ],
    };

    const layouts = buildTimelineParentScopeLayouts([parent], {
      dateStart,
      scale,
      hours24InDay: true,
      issueRowHeightPx: 37,
      roadmapBandHeightPx: 0,
    });

    expect(layouts).toHaveLength(1);
    // day 0 origin → left near 0 (minus pad), not day 7
    expect(layouts[0].leftPx).toBeLessThan(scale);
  });

  it('skips collapsed parents', () => {
    const parent: TimelineIssue = {
      id: 'parent-2',
      title: 'Parent',
      date_start_calc: '2026-01-02T00:00:00.000Z',
      date_end_calc: '2026-01-10T00:00:00.000Z',
      _SHOWCHILDS: false,
      childs: [
        {
          id: 'child-2',
          title: 'Child',
          date_start_calc: '2026-01-03T00:00:00.000Z',
          date_end_calc: '2026-01-05T00:00:00.000Z',
        },
      ],
    };

    const layouts = buildTimelineParentScopeLayouts([parent], {
      dateStart,
      scale,
      hours24InDay: true,
      issueRowHeightPx: 37,
      roadmapBandHeightPx: 0,
    });

    expect(layouts).toHaveLength(0);
  });
});
