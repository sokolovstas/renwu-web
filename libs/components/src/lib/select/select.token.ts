import { InjectionToken } from '@angular/core';
import { ISelectModel } from './select.model';

export const RW_SELECT_ICON_UP = new InjectionToken<string>(
  'keyboard_arrow_up',
);
export const RW_SELECT_ICON_DOWN = new InjectionToken<string>(
  'keyboard_arrow_down',
);
export const RW_SELECT_MODELS = new InjectionToken<
  Record<string, () => ISelectModel<unknown>>
>('Select models', { factory: () => ({}) });
