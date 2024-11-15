import {
  add,
  endOfDay,
  endOfHour,
  endOfMinute,
  endOfMonth,
  endOfQuarter,
  endOfSecond,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfHour,
  startOfMinute,
  startOfMonth,
  startOfQuarter,
  startOfSecond,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export function parseRelativeDate(
  value: string,
  type: 'from' | 'to' | '' = '',
): Date {
  // -2d - now minus 2 days
  // now-2d - now minus 2 days
  // - d - one day before
  // -y/y - start of prev year
  const relativeTimeRe = /(([-+]\d*)\s*(m|M|y|h|d|w)|now)\/?(m|M|y|h|d|w|q)?/;
  const parsed = relativeTimeRe.exec(value);
  if (!parsed) {
    return new Date('!');
  }
  let date: Date;
  if (parsed[1] === 'now') {
    date = new Date();
  }
  if (parsed[1] && parsed[3]) {
    date = new Date();
    switch (parsed[3]) {
      case 'm':
        date = add(date, { minutes: Number(parsed[2]) });
        break;
      case 'M':
        date = add(date, { months: Number(parsed[2]) });
        break;
      case 'y':
        date = add(date, { years: Number(parsed[2]) });
        break;
      case 'h':
        date = add(date, { hours: Number(parsed[2]) });
        break;
      case 'd':
        date = add(date, { days: Number(parsed[2]) });
        break;
      case 'w':
        date = add(date, { weeks: Number(parsed[2]) });
        break;
    }
  }
  if (parsed[4] && type === 'from') {
    date = startOf(date, parsed[3] as TimeUnit);
  }
  if (parsed[4] && type === 'to') {
    date = endOf(date, parsed[3] as TimeUnit);
  }
  if (!date) {
    return new Date('!');
  }
  return date;
}

export type TimeUnit =
  | 'year'
  | 'y'
  | 'month'
  | 'M'
  | 'week'
  | 'w'
  | 'day'
  | 'd'
  | 'hour'
  | 'h'
  | 'minute'
  | 'm'
  | 'second'
  | 's'
  | 'quarter'
  | 'q';
export function startOf(date: Date, unit: TimeUnit): Date {
  switch (unit) {
    case 'y':
    case 'year':
      return startOfYear(date);
    case 'quarter':
    case 'q':
      return startOfQuarter(date);
    case 'month':
    case 'M':
      return startOfMonth(date);
    case 'week':
    case 'w':
      return startOfWeek(date);
    case 'day':
    case 'd':
      return startOfDay(date);
    case 'hour':
    case 'h':
      return startOfHour(date);
    case 'minute':
    case 'm':
      return startOfMinute(date);
    case 'second':
    case 's':
      return startOfSecond(date);
  }
}

export function endOf(date: Date, unit: TimeUnit): Date {
  switch (unit) {
    case 'y':
    case 'year':
      return endOfYear(date);
    case 'quarter':
    case 'q':
      return endOfQuarter(date);
    case 'month':
    case 'M':
      return endOfMonth(date);
    case 'week':
    case 'w':
      return endOfWeek(date);
    case 'day':
    case 'd':
      return endOfDay(date);
    case 'hour':
    case 'h':
      return endOfHour(date);
    case 'minute':
    case 'm':
      return endOfMinute(date);
    case 'second':
    case 's':
      return endOfSecond(date);
  }
}
