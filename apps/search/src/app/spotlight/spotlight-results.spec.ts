import { Container } from '@renwu/core';
import { Issue } from '@renwu/core';
import { SearchHit } from '@renwu/core';
import { User } from '@renwu/core';
import {
  buildSpotlightItems,
  flattenGroups,
  groupSpotlightItems,
  moveActiveIndex,
  snippetFromHit,
} from './spotlight-results';

describe('snippetFromHit', () => {
  it('uses the first HTML fragment as plain text', () => {
    const hit: SearchHit = {
      index: 'issues',
      id: '1',
      score: 1,
      sort: '',
      fields: {},
      locations: {},
      fragments: {
        title: ['Fix <mark>login</mark> timeout'],
      },
    };
    expect(snippetFromHit(hit, 'ignored')).toBe('Fix login timeout');
  });

  it('falls back to a truncated description', () => {
    const fallback = 'A'.repeat(200);
    expect(snippetFromHit(undefined, fallback).length).toBeLessThanOrEqual(140);
    expect(snippetFromHit(undefined, fallback).startsWith('A')).toBe(true);
  });
});

describe('buildSpotlightItems + groupSpotlightItems', () => {
  const bug: Issue = {
    id: 'i1',
    key: 'RW-1',
    title: 'Login timeout',
    description: 'Users cannot login',
    type: { id: 'bug', sort: 1, label: 'Bug', color: '#f00', symbol: 'B', default: false },
  };
  const task: Issue = {
    id: 'i2',
    key: 'RW-2',
    title: 'Update docs',
    type: { id: 'task', sort: 2, label: 'Task', color: '#00f', symbol: 'T', default: true },
  };
  const hits: SearchHit[] = [
    {
      index: 'issues',
      id: 'i1',
      score: 2,
      sort: '',
      fields: {},
      locations: {},
      fragments: { description: ['Users cannot <em>login</em>'] },
    },
  ];
  const users: User[] = [
    { id: 'u1', username: 'ada', full_name: 'Ada Lovelace' },
    { id: 'u2', username: 'bob', full_name: 'Bob Martin' },
  ];
  const projects: Container[] = [
    { id: 'p1', key: 'CORE', title: 'Login platform' },
    { id: 'p2', key: 'WEB', title: 'Web app' },
  ];

  it('groups issues by type and adds people and projects', () => {
    const items = buildSpotlightItems({
      query: 'lo',
      issues: [bug, task],
      hits,
      users,
      projects,
    });
    const groups = groupSpotlightItems(items);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Bug');
    expect(labels).toContain('Task');
    expect(labels).toContain('people');
    expect(labels).toContain('projects');

    const bugItem = items.find((i) => i.id === 'i1');
    expect(bugItem?.kind).toBe('issue');
    expect(bugItem?.snippet).toBe('Users cannot login');
    expect(bugItem?.subtitle).toBe('RW-1');

    expect(items.some((i) => i.kind === 'user' && i.id === 'u1')).toBe(true);
    expect(items.some((i) => i.kind === 'project' && i.id === 'p1')).toBe(true);
    expect(items.some((i) => i.kind === 'user' && i.id === 'u2')).toBe(false);
  });

  it('returns recent history when the query is empty', () => {
    const items = buildSpotlightItems({
      query: '  ',
      issues: [bug],
      hits,
      users,
      projects,
      history: [{ query_string: 'assignee = me' }],
    });
    expect(items.every((i) => i.kind === 'history')).toBe(true);
    expect(items[0].title).toBe('assignee = me');
  });
});

describe('keyboard navigation', () => {
  it('wraps at the ends', () => {
    expect(moveActiveIndex(0, -1, 3)).toBe(2);
    expect(moveActiveIndex(2, 1, 3)).toBe(0);
    expect(moveActiveIndex(1, 1, 3)).toBe(2);
  });

  it('returns -1 when there are no items', () => {
    expect(moveActiveIndex(0, 1, 0)).toBe(-1);
  });

  it('flattens groups in display order', () => {
    const items = buildSpotlightItems({
      query: 'a',
      issues: [
        {
          id: 'i1',
          key: 'RW-1',
          title: 'A',
          type: { id: 'bug', sort: 1, label: 'Bug', color: '', symbol: '', default: false },
        },
      ],
      hits: [],
      users: [{ id: 'u1', username: 'ada', full_name: 'Ada' }],
      projects: [],
    });
    const flat = flattenGroups(groupSpotlightItems(items));
    expect(flat.map((i) => i.kind)).toEqual(['issue', 'user']);
  });
});
