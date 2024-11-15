import { InjectionToken, Type } from '@angular/core';
import { Issue } from '@renwu/core';

export interface ITaskCard {
  issue: Issue;
}
export class RwBoardsSettings {
  components: Record<string, Type<ITaskCard>> = {};
}

export const RW_BOARD_SETTINGS = new InjectionToken<RwBoardsSettings>(
  'RW_BOARD_SETTINGS',
  {
    providedIn: 'root',
    factory: () => {
      const settings = new RwBoardsSettings();
      return settings;
    },
  },
);
