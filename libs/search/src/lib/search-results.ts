import {
  Container,
  Issue,
  SearchHit,
  User,
  UserStatic,
} from '@renwu/core';

export type SearchItemKind = 'issue' | 'user' | 'project' | 'history';

export interface SearchItem {
  id: string;
  kind: SearchItemKind;
  group: string;
  groupOrder: number;
  title: string;
  titleHtml?: string;
  subtitle?: string;
  snippet?: string;
  snippetHtml?: string;
  snippetField?: string;
  badge?: string;
  badgeColor?: string;
  issue?: Issue;
  user?: User;
  project?: Container;
  historyQuery?: string;
}

export interface SearchGroup {
  id: string;
  label: string;
  order: number;
  items: SearchItem[];
}

export interface SearchView {
  groups: SearchGroup[];
  items: SearchItem[];
}

export const GROUP_PEOPLE = 'people';
export const GROUP_PROJECTS = 'projects';
export const GROUP_RECENT = 'recent';
export const GROUP_ISSUES = 'issues';

const SNIPPET_MAX = 180;
const SIDE_LIMIT = 5;
const SNIPPET_FIELDS = [
  'description',
  'comment',
  'comments.message',
  'todos.description',
  'title',
  'key',
];

export function plainText(value: string | undefined): string {
  return (value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightQuery(text: string, query: string): string {
  const source = text || '';
  const terms = [
    ...new Set(
      (query || '')
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 1),
    ),
  ].sort((a, b) => b.length - a.length);
  const escaped = escapeHtml(source);
  if (!terms.length) {
    return escaped;
  }
  const pattern = terms.map(escapeRegExp).join('|');
  return escaped.replace(
    new RegExp(`(${pattern})`, 'gi'),
    '<span class="search-hl">$1</span>',
  );
}

export function toHighlightHtml(html: string): string {
  const tokens: string[] = [];
  const withTokens = (html || '')
    .replace(/<\/?(mark|em|strong)[^>]*>/gi, (tag) => {
      tokens.push(tag.startsWith('</') ? '</span>' : '<span class="search-hl">');
      return `\0${tokens.length - 1}\0`;
    });
  return escapeHtml(withTokens).replace(/\0(\d+)\0/g, (_, index) => tokens[Number(index)]);
}

export function snippetFieldKey(field?: string): string {
  if (field === 'description') {
    return 'search.field-description';
  }
  if (field === 'comment' || field === 'comments.message') {
    return 'search.field-comment';
  }
  if (field === 'todos.description') {
    return 'search.field-todo';
  }
  if (field === 'title') {
    return 'search.field-title';
  }
  if (field === 'key') {
    return 'search.field-key';
  }
  return '';
}

export function snippetFromHit(
  hit: SearchHit | undefined,
  fallback?: string,
  query?: string,
): { text: string; html: string; field?: string } {
  const fragments = hit?.fragments || {};
  for (const field of SNIPPET_FIELDS) {
    const first = fragments[field]?.[0];
    if (!first) {
      continue;
    }
    const text = plainText(first);
    if (!text) {
      continue;
    }
    return {
      field,
      text: text.length > SNIPPET_MAX ? text.slice(0, SNIPPET_MAX) : text,
      html: toHighlightHtml(first),
    };
  }
  const source = plainText(fallback);
  const needle = (query || '').trim().toLowerCase();
  if (!source || !needle || !source.toLowerCase().includes(needle)) {
    return { text: '', html: '' };
  }
  const clipped =
    source.length > SNIPPET_MAX ? source.slice(0, SNIPPET_MAX) : source;
  return {
    field: 'description',
    text: clipped,
    html: highlightQuery(clipped, query || ''),
  };
}

export function moveActiveIndex(
  current: number,
  delta: number,
  length: number,
): number {
  if (length <= 0) {
    return -1;
  }
  return (current + delta + length) % length;
}

export function buildSearchItems(input: {
  query: string;
  issues: Issue[];
  hits: SearchHit[];
  users: User[];
  projects: Container[];
}): SearchItem[] {
  const query = (input.query || '').trim();
  if (!query) {
    return [];
  }

  const needle = query.toLowerCase();
  const hitsById = new Map((input.hits || []).map((hit) => [hit.id, hit]));
  const items: SearchItem[] = [];

  for (const issue of input.issues || []) {
    const typeLabel = issue.type?.label || GROUP_ISSUES;
    const hit = issue.id ? hitsById.get(issue.id) : undefined;
    const title = issue.title || issue.key || '';
    const titleFrag = hit?.fragments?.['title']?.[0];
    const snippet = snippetFromHit(hit, issue.description, query);
    const showSnippet = !!(
      snippet.text &&
      snippet.field &&
      snippet.field !== 'title' &&
      snippet.field !== 'key'
    );
    items.push({
      id: issue.id || issue.key || typeLabel,
      kind: 'issue',
      group: typeLabel,
      groupOrder: 10 + (issue.type?.sort ?? 0),
      title,
      titleHtml: titleFrag ? toHighlightHtml(titleFrag) : highlightQuery(title, query),
      subtitle: issue.key,
      snippet: showSnippet ? snippet.text : undefined,
      snippetHtml: showSnippet ? snippet.html : undefined,
      snippetField: showSnippet ? snippet.field : undefined,
      badge: typeLabel,
      badgeColor: issue.type?.color,
      issue,
    });
  }

  const users = UserStatic.filterAndSort([...(input.users || [])], query).slice(
    0,
    SIDE_LIMIT,
  );
  for (const user of users) {
    const title = user.full_name || user.username || '';
    items.push({
      id: user.id || user.username || user.full_name || '',
      kind: 'user',
      group: GROUP_PEOPLE,
      groupOrder: 100,
      title,
      titleHtml: highlightQuery(title, query),
      subtitle: user.username,
      snippet: user.email,
      snippetHtml: user.email ? highlightQuery(user.email, query) : undefined,
      user,
    });
  }

  const projects = (input.projects || [])
    .filter((project) => {
      const hay = `${project.title || ''} ${project.key || ''}`.toLowerCase();
      return hay.includes(needle);
    })
    .slice(0, SIDE_LIMIT);
  for (const project of projects) {
    items.push({
      id: project.id || project.key,
      kind: 'project',
      group: GROUP_PROJECTS,
      groupOrder: 110,
      title: project.title,
      titleHtml: highlightQuery(project.title || '', query),
      subtitle: project.key,
      project,
    });
  }

  return items;
}

export function groupSearchItems(items: SearchItem[]): SearchGroup[] {
  const groups = new Map<string, SearchGroup>();
  for (const item of items) {
    const existing = groups.get(item.group);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(item.group, {
      id: item.group,
      label: item.group,
      order: item.groupOrder,
      items: [item],
    });
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}

export function flattenGroups(groups: SearchGroup[]): SearchItem[] {
  return groups.flatMap((group) => group.items);
}

export function toSearchView(items: SearchItem[]): SearchView {
  const groups = groupSearchItems(items);
  return { groups, items: flattenGroups(groups) };
}

export function groupTranslateKey(group: SearchGroup): string {
  if (group.id === GROUP_PEOPLE) {
    return 'search.people';
  }
  if (group.id === GROUP_PROJECTS) {
    return 'search.projects';
  }
  if (group.id === GROUP_RECENT) {
    return 'search.recent';
  }
  return '';
}
