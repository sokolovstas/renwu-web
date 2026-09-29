import {
  DashboardSettings,
  DashboardWidget,
  DashboardWidgetCols,
  DashboardWidgetDensity,
  DashboardWidgetGroupBy,
  DashboardWidgetSource,
} from '@renwu/core';

export const MY_WORK_QUERY =
  'assignee = $me completed = false sort = date_start';

export const DEFAULT_MY_WORK_ID = 'default-my-work';
export const DEFAULT_RECENT_ID = 'default-recent';
export const DEFAULT_WATCHED_ID = 'default-watched';

const SOURCES: DashboardWidgetSource[] = ['query', 'recent', 'watcher'];
const DENSITIES: DashboardWidgetDensity[] = ['compact', 'normal'];
const GROUPS: DashboardWidgetGroupBy[] = ['none', 'schedule', 'day'];

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `widget-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function defaultWidgets(): DashboardWidget[] {
  return [
    {
      id: DEFAULT_MY_WORK_ID,
      title: '',
      titleKey: 'my-work',
      source: 'query',
      query: MY_WORK_QUERY,
      cols: 2,
      density: 'normal',
      groupBy: 'schedule',
    },
    {
      id: DEFAULT_RECENT_ID,
      title: '',
      titleKey: 'recently-opened',
      source: 'recent',
      query: '',
      cols: 1,
      density: 'compact',
      groupBy: 'none',
    },
    {
      id: DEFAULT_WATCHED_ID,
      title: '',
      titleKey: 'watched',
      source: 'watcher',
      query: '',
      cols: 1,
      density: 'compact',
      groupBy: 'none',
    },
  ];
}

export function createQueryWidget(
  partial: Partial<DashboardWidget> = {},
): DashboardWidget {
  return {
    id: newId(),
    title: '',
    titleKey: 'new-widget',
    source: 'query',
    query: MY_WORK_QUERY,
    cols: 1,
    density: 'compact',
    groupBy: 'none',
    ...partial,
  };
}

function asSource(value: unknown): DashboardWidgetSource {
  return SOURCES.includes(value as DashboardWidgetSource)
    ? (value as DashboardWidgetSource)
    : 'query';
}

function asCols(value: unknown): DashboardWidgetCols {
  return value === 2 || value === '2' ? 2 : 1;
}

function asDensity(value: unknown): DashboardWidgetDensity {
  return DENSITIES.includes(value as DashboardWidgetDensity)
    ? (value as DashboardWidgetDensity)
    : 'compact';
}

function asGroupBy(value: unknown): DashboardWidgetGroupBy {
  return GROUPS.includes(value as DashboardWidgetGroupBy)
    ? (value as DashboardWidgetGroupBy)
    : 'none';
}

export function sanitizeWidget(
  raw: Partial<DashboardWidget> | null | undefined,
): DashboardWidget | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const id = typeof raw.id === 'string' && raw.id ? raw.id : newId();
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    titleKey: typeof raw.titleKey === 'string' ? raw.titleKey : undefined,
    source: asSource(raw.source),
    query: typeof raw.query === 'string' ? raw.query : MY_WORK_QUERY,
    cols: asCols(raw.cols),
    density: asDensity(raw.density),
    groupBy: asGroupBy(raw.groupBy),
  };
}

export function widgetsFromSettings(
  settings: DashboardSettings | undefined,
): DashboardWidget[] {
  const raw = settings?.widgets;
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultWidgets();
  }
  const widgets = raw
    .map((item) => sanitizeWidget(item))
    .filter((item): item is DashboardWidget => !!item);
  return widgets.length ? widgets : defaultWidgets();
}

export function reorderWidgets(
  widgets: DashboardWidget[],
  fromIndex: number,
  toIndex: number,
): DashboardWidget[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= widgets.length ||
    toIndex >= widgets.length
  ) {
    return widgets;
  }
  const next = [...widgets];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
