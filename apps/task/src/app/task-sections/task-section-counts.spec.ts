import { computeTaskSectionCounts } from './task-section-counts';

describe('computeTaskSectionCounts', () => {
  it('returns zeros for empty issue', () => {
    const counts = computeTaskSectionCounts({}, null);
    expect(counts['renwu-task-todo']).toBe(0);
    expect(counts['renwu-task-links']).toBe(0);
    expect(counts['renwu-task-related']).toBe(0);
    expect(counts['renwu-task-attachments']).toBe(0);
    expect(counts['renwu-task-time-log']).toBe(0);
    expect(counts['renwu-task-sub-task']).toBe(0);
  });

  it('counts todos, attachments, links and related', () => {
    const counts = computeTaskSectionCounts(
      {
        todos: [{ description: 'a' }, { description: 'b' }],
        attachments: [{ id: '1' } as never, { id: '2' } as never],
        time_logs: [{ duration: 60 } as never],
        links: {
          parent: [{ key: 'P-1' }],
          prev_issue: [{ key: 'P-2' }],
          next_issue: [],
          related: [{ key: 'R-1' }, { key: 'R-2' }],
        },
      },
      { childs_total: 4 },
    );
    expect(counts['renwu-task-todo']).toBe(2);
    expect(counts['renwu-task-attachments']).toBe(2);
    expect(counts['renwu-task-time-log']).toBe(1);
    expect(counts['renwu-task-links']).toBe(2);
    expect(counts['renwu-task-related']).toBe(2);
    expect(counts['renwu-task-sub-task']).toBe(4);
  });

  it('uses pending subtasks when childs_total is missing', () => {
    const counts = computeTaskSectionCounts({}, null, 3);
    expect(counts['renwu-task-sub-task']).toBe(3);
  });

  it('prefers loaded childs total over zero on issue payload', () => {
    const counts = computeTaskSectionCounts({}, { childs_total: 0 }, 0, 10);
    expect(counts['renwu-task-sub-task']).toBe(10);
  });
});
