import { unixSeconds } from './date-helpers';

/**
 * UTC port of `IssueDateTime.setVirtualHours`: maps wall time into a 0–24 "virtual" hour range
 * where the working band (10–18 local in original) maps to a full 24h segment on the axis.
 * Used for timeline axis when `hours24InDay` is false (8h workday view).
 */
export function mapUtcDateVirtualHours(
  date: Date,
  hours24InDay: boolean,
  edge: 'start' | 'end' | '',
): Date {
  if (hours24InDay) {
    return new Date(date.getTime());
  }
  const result = new Date(date.getTime());
  let hour = result.getUTCHours();
  if (edge === 'start') {
    hour = 18 - Math.min(24 - hour, 8);
  }
  if (edge === 'end') {
    hour = 10 + Math.min(hour, 8);
  }
  hour = ((hour - 10) / 8) * 24;
  hour = hour > 24 ? 24 : hour;
  hour = hour < 0 ? 0 : hour;
  result.setUTCHours(
    hour,
    result.getUTCMinutes(),
    result.getUTCSeconds(),
    result.getUTCMilliseconds(),
  );
  return result;
}

export function unixSecondsVirtual(
  date: Date,
  hours24InDay: boolean,
  edge: 'start' | 'end' | '',
): number {
  return unixSeconds(mapUtcDateVirtualHours(date, hours24InDay, edge));
}
