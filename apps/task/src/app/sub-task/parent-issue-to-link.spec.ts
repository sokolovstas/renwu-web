import { Issue } from '@renwu/core';

import { parentIssueToLink } from './parent-issue-to-link';

describe('parentIssueToLink', () => {
  it('omits empty date fields and status for API payloads', () => {
    const link = parentIssueToLink({
      id: '1',
      key: 'P-1',
      title: 'Parent',
      have_childs: false,
      date_start: '',
      date_end: '  ',
      status: { id: 's1', label: 'Open' },
    } as Issue);

    expect(link).toEqual({
      id: '1',
      key: 'P-1',
      title: 'Parent',
      have_childs: false,
    });
  });

  it('keeps non-empty dates', () => {
    const link = parentIssueToLink({
      id: '1',
      key: 'P-1',
      title: 'Parent',
      date_start: '2026-01-02T10:00:00Z',
      date_end: '2026-01-03T10:00:00Z',
    } as Issue);

    expect(link.date_start).toBe('2026-01-02T10:00:00Z');
    expect(link.date_end).toBe('2026-01-03T10:00:00Z');
  });
});
