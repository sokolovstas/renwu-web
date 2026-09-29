export type DashboardWidgetSource = 'query' | 'recent' | 'watcher';
export type DashboardWidgetCols = 1 | 2;
export type DashboardWidgetDensity = 'compact' | 'normal';
export type DashboardWidgetGroupBy = 'none' | 'schedule' | 'day';

export interface DashboardWidget {
  id: string;
  /** Custom title; empty means use `titleKey`. */
  title: string;
  /** i18n key under `dashboard.*` for default widgets. */
  titleKey?: string;
  source: DashboardWidgetSource;
  query: string;
  cols: DashboardWidgetCols;
  density: DashboardWidgetDensity;
  groupBy: DashboardWidgetGroupBy;
}

export interface DashboardSettings {
  widgets: DashboardWidget[];
}

export interface Dashboard {
  id?: string;
  title: string;
  author_id?: string;
  shared?: boolean;
  widgets: DashboardWidget[];
}
