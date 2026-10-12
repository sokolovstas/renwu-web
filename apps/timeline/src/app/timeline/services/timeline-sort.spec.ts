import { timelineSortParam } from './timeline-sort';

describe('timelineSortParam', () => {
  it('defaults to status ascending', () => {
    expect(timelineSortParam(undefined)).toBe('status');
    expect(timelineSortParam(null)).toBe('status');
    expect(timelineSortParam({})).toBe('status');
  });

  it('maps status and start date with direction prefix', () => {
    expect(timelineSortParam({ field: 'status', direction: 'up' })).toBe(
      'status',
    );
    expect(timelineSortParam({ field: 'status', direction: 'down' })).toBe(
      '-status',
    );
    expect(
      timelineSortParam({ field: 'date_start_calc', direction: 'up' }),
    ).toBe('date_start_calc');
    expect(
      timelineSortParam({ field: 'date_start_calc', direction: 'down' }),
    ).toBe('-date_start_calc');
  });
});
