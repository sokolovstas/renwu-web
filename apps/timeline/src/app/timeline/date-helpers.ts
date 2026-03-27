import { addSeconds, isValid } from 'date-fns';

export function unixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function normalizeIsoLike(value: string): string {
  // Normalize common ISO-like formats (replace space with `T`).
  return value.replace(' ', 'T').trim();
}

/**
 * Parses a string into a UTC `Date`:
 * - if timezone is missing, treat the ISO-like string as UTC by appending `Z`
 * - if timezone exists, let JS parse it normally
 * - supports numeric strings as epoch milliseconds (same as `new Date(number)`)
 */
export function parseUtcLike(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  // Numeric strings: epoch milliseconds.
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const d = new Date(Number(raw));
    return isValid(d) ? d : null;
  }

  const normalized = normalizeIsoLike(raw);
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized);
  const isoNoZone =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/.test(
      normalized,
    );

  const candidate = !hasZone && isoNoZone ? `${normalized}Z` : normalized;
  const d = new Date(candidate);
  return isValid(d) ? d : null;
}

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

