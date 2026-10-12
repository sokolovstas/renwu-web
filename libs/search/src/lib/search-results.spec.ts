import { Container, Issue, SearchHit, User } from '@renwu/core';
import {
  buildSearchItems,
  flattenGroups,
  groupSearchItems,
  highlightQuery,
  moveActiveIndex,
  snippetFromHit,
  toHighlightHtml,
} from './search-results';

describe('snippetFromHit', () => {
  it('keeps highlight markup from a body fragment', () => {
    const hit: SearchHit = {
      index: 'issues',
      id: '1',
      score: 1,
      sort: '',
      fields: {},
      locations: {},
      fragments: {
        description: ['Users cannot <mark>login</mark> now'],
      },
    };
    const snippet = snippetFromHit(hit, 'ignored');
    expect(snippet.text).toBe('Users cannot login now');
    expect(snippet.field).toBe('description');
    expect(snippet.html).toContain('search-hl');
    expect(snippet.html).toContain('login');
  });

  it('highlights a fallback description when it contains the query', () => {
    const snippet = snippetFromHit(undefined, 'Export catalog from core', 'catalog');
    expect(snippet.field).toBe('description');
    expect(snippet.html).toContain('search-hl');
    expect(snippet.html).toContain('catalog');
  });
});

describe('highlight helpers', () => {
  it('wraps query terms and escapes html', () => {
    expect(highlightQuery('A <b> catalog', 'catalog')).toBe(
      'A &lt;b&gt; <span class="search-hl">catalog</span>',
    );
  });

  it('keeps only mark/em tags from bleve html', () => {
    expect(toHighlightHtml('x <mark>y</mark> <script>z</script>')).toBe(
      'x <span class="search-hl">y</span> &lt;script&gt;z&lt;/script&gt;',
    );
  });
});

describe('buildSearchItems + groupSearchItems', () => {
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
    const items = buildSearchItems({
      query: 'lo',
      issues: [bug, task],
      hits,
      users,
      projects,
    });
    const groups = groupSearchItems(items);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Bug');
    expect(labels).toContain('Task');
    expect(labels).toContain('people');
    expect(labels).toContain('projects');

    const bugItem = items.find((i) => i.id === 'i1');
    expect(bugItem?.kind).toBe('issue');
    expect(bugItem?.snippet).toBe('Users cannot login');
    expect(bugItem?.snippetHtml).toContain('search-hl');
    expect(bugItem?.titleHtml).toContain('search-hl');
    expect(bugItem?.subtitle).toBe('RW-1');

    expect(items.some((i) => i.kind === 'user' && i.id === 'u1')).toBe(true);
    expect(items.some((i) => i.kind === 'project' && i.id === 'p1')).toBe(true);
    expect(items.some((i) => i.kind === 'user' && i.id === 'u2')).toBe(false);
  });

  it('does not surface OQL history when the query is empty', () => {
    const items = buildSearchItems({
      query: '  ',
      issues: [bug],
      hits,
      users,
      projects,
    });
    expect(items).toEqual([]);
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
    const items = buildSearchItems({
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
    const flat = flattenGroups(groupSearchItems(items));
    expect(flat.map((i) => i.kind)).toEqual(['issue', 'user']);
  });
});
