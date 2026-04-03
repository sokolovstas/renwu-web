import { addSeconds } from 'date-fns';

export function unixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export { parseUtcLike } from '@renwu/utils';

export function addSecondsUtc(date: Date, seconds: number): Date {
  // `addSeconds` works on timestamps; the result is still a Date object,
  // and `toISOString()` always serializes in UTC.
  return addSeconds(date, seconds);
}

export function addMonthsUtc(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + months;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(year, targetMonth + 1, 0),
  ).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfTargetMonth);

  return new Date(
    Date.UTC(
      year,
      targetMonth,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}
