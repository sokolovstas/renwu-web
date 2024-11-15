import { InjectionToken } from '@angular/core';

export const RW_SHOW_DATE_TIME_FORMAT = new InjectionToken<string>(
  'Date and time format for date picker',
);
export const RW_SHOW_DATE_FORMAT = new InjectionToken<string>(
  'Date only format for date picker',
);
