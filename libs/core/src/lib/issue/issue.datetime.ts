import { JSONUtils } from '@renwu/utils';
import { getHours } from 'date-fns';
import { Subject } from 'rxjs';

export class IssueDateTime {
  set hours24InDay(value: boolean) {
    this._hours24InDay = value;
    if (this.show24HoursInDay) {
      this.show24HoursInDay.next(value);
    }
    this.save();
  }
  get hours24InDay(): boolean {
    return this._hours24InDay;
  }
  _hours24InDay: boolean;

  public show24HoursInDay = new Subject<boolean>();

  constructor() {
    this.load();
  }

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
  save(): void {
    JSONUtils.setLocalStorage('renwu_hours24InDay', this.hours24InDay);
  }
  load(): void {
    this._hours24InDay = JSONUtils.parseLocalStorage(
      'renwu_hours24InDay',
      true,
    );
  }
}
