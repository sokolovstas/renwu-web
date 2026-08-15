import {
  Container,
  Issue,
  SearchHit,
  SearchHistory,
  User,
  UserStatic,
} from '@renwu/core';

export type SpotlightKind = 'issue' | 'user' | 'project' | 'history';

export interface SpotlightItem {
  id: string;
  kind: SpotlightKind;
  group: string;
  groupOrder: number;
  title: string;
  subtitle?: string;
  snippet?: string;
  badge?: string;
  badgeColor?: string;
  issue?: Issue;
  user?: User;
  project?: Container;
  historyQuery?: string;
}

export interface SpotlightGroup {
  id: string;
  label: string;
  order: number;
  items: SpotlightItem[];
}

export const GROUP_PEOPLE = 'people';
export const GROUP_PROJECTS = 'projects';
export const GROUP_RECENT = 'recent';
export const GROUP_ISSUES = 'issues';

const SNIPPET_MAX = 140;
const SIDE_LIMIT = 5;

export function plainText(value: string | undefined): string {
  return (value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function snippetFromHit(
  hit: SearchHit | undefined,
  fallback?: string,
): string {
  const fragments = hit?.fragments || {};
  for (const field of Object.keys(fragments)) {
    const first = fragments[field]?.[0];
    const text = plainText(first);
    if (text) {
      return text.length > SNIPPET_MAX ? text.slice(0, SNIPPET_MAX) : text;
    }
  }
  const source = plainText(fallback);
  if (source.length <= SNIPPET_MAX) {
    return source;
  }
  return source.slice(0, SNIPPET_MAX);
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

export function buildSpotlightItems(input: {
  query: string;
  issues: Issue[];
  hits: SearchHit[];
  users: User[];
  projects: Container[];
  history?: SearchHistory[];
}): SpotlightItem[] {
  const query = (input.query || '').trim();
  if (!query) {
    return (input.history || [])
      .filter((h) => (h.query_string || '').trim())
      .slice(0, 8)
      .map((h, index) => ({
        id: `history-${h.id || h.hash || index}`,
        kind: 'history' as const,
        group: GROUP_RECENT,
        groupOrder: 0,
        title: h.query_string,
        historyQuery: h.query_string,
      }));
  }

  const needle = query.toLowerCase();
  const hitsById = new Map((input.hits || []).map((hit) => [hit.id, hit]));
  const items: SpotlightItem[] = [];

  for (const issue of input.issues || []) {
    const typeLabel = issue.type?.label || GROUP_ISSUES;
    const hit = issue.id ? hitsById.get(issue.id) : undefined;
    items.push({
      id: issue.id || issue.key || typeLabel,
      kind: 'issue',
      group: typeLabel,
      groupOrder: 10 + (issue.type?.sort ?? 0),
      title: issue.title || issue.key || '',
      subtitle: issue.key,
      snippet: snippetFromHit(hit, issue.description),
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
    items.push({
      id: user.id || user.username || user.full_name || '',
      kind: 'user',
      group: GROUP_PEOPLE,
      groupOrder: 100,
      title: user.full_name || user.username || '',
      subtitle: user.username,
      snippet: user.email,
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
      subtitle: project.key,
      project,
    });
  }

  return items;
}

export function groupSpotlightItems(items: SpotlightItem[]): SpotlightGroup[] {
  const groups = new Map<string, SpotlightGroup>();
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

export function flattenGroups(groups: SpotlightGroup[]): SpotlightItem[] {
  return groups.flatMap((group) => group.items);
}
