import { Injectable } from '@angular/core';
import { getHours } from 'date-fns';
import { Subject } from 'rxjs';

/** In-memory timeline axis mode; persisted via `TimelineSettingsService` / `profile.timeline`. */
export class IssueDateTime {
  private _hours24InDay = true;

  set hours24InDay(value: boolean) {
    this._hours24InDay = value;
    this.show24HoursInDay.next(value);
  }

  get hours24InDay(): boolean {
    return this._hours24InDay;
  }

  readonly show24HoursInDay = new Subject<boolean>();

  setVirtualHours(date: Date, type = ''): Date {
    if (this.hours24InDay) {
      return date;
    }

    const result = new Date(date);
    let hour = getHours(date);
    if (type === 'start') {
      hour = 18 - Math.min(24 - hour, 8);
    }
    if (type === 'end') {
      hour = 10 + Math.min(hour, 8);
    }
    hour = ((hour - 10) / 8) * 24;
    hour = hour > 24 ? 24 : hour;
    hour = hour < 0 ? 0 : hour;
    result.setHours(hour);
    return result;
  }
}

@Injectable({ providedIn: 'root' })
export class RwIssueDateTimeService {
  readonly issueDateTime = new IssueDateTime();
}
