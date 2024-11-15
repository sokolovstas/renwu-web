import { inject, Injectable, InjectionToken } from '@angular/core';

export interface SortField {
  name: string;
  direction: string;
}
export type TableSettings = Record<
  string,
  {
    width: string;
    style?: Record<string, string>;
    styleHead?: Record<string, string>;
    priority: number;
  }
>;

@Injectable({
  providedIn: 'root',
})
export class RwSortTableSettingsService {
  timeout: number;

  settings: TableSettings = inject(RW_TABLE_SETTINGS) || {};

  getColumnStyle(columnId: string, isHead: boolean) {
    const ids = columnId.split(':');
    const width =
      this.settings[columnId]?.width || this.settings[ids[1]]?.width || '100%';

    const colStyles =
      this.settings[columnId]?.style || this.settings[ids[1]]?.style || {};

    const colHeadStyles =
      this.settings[columnId]?.styleHead ||
      this.settings[ids[1]]?.styleHead ||
      {};

    let style = {
      flexBasis: width,
      flex: '1 1',
      whiteSpace: 'nowrap',
      ...colStyles,
    };
    if (!width.includes('%')) {
      style.flex = '0 0';
    }
    if (isHead) {
      style = { ...style, ...colHeadStyles };
    }
    return style;
  }
  getColumnPriority(columnId: string): number {
    const ids = columnId.split(':');
    return (
      this.settings[columnId]?.priority || this.settings[ids[1]]?.priority || 0
    );
  }
}

export const RW_TABLE_SETTINGS = new InjectionToken<TableSettings>(
  'RW_TABLE_SETTINGS',
  { providedIn: 'root', factory: () => ({}) },
);
