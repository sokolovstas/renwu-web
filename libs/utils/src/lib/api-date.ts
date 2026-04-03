import { isValid } from 'date-fns';

function normalizeIsoLike(value: string): string {
  return value.replace(' ', 'T').trim();
}

/**
 * Parses a string into a UTC `Date`:
 * - if timezone is missing, treat the ISO-like string as UTC by appending `Z`
 * - if timezone exists, let JS parse it normally
 * - numeric strings: values < 1e10 are treated as epoch seconds, otherwise milliseconds
 * - returns null for "zero" dates (year < 1970) like Go's `0001-01-01T00:00:00Z`
 */
export function parseUtcLike(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  let d: Date;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const num = Number(raw);
    const ms = num < 1e10 ? num * 1000 : num;
    d = new Date(ms);
  } else {
    const normalized = normalizeIsoLike(raw);
    const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized);
    const isoNoZone =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/.test(
        normalized,
      );

    const candidate = !hasZone && isoNoZone ? `${normalized}Z` : normalized;
    d = new Date(candidate);
  }

  if (!isValid(d) || d.getFullYear() < 1970) return null;
  return d;
}

/**
 * Maps API / Go sentinel dates to "no date" for UI (e.g. date picker).
 */
export function normalizeApiDate(d: Date | null | undefined): Date | null {
  if (!d || !isValid(d)) return null;
  if (d.getFullYear() < 1970) return null;
  return d;
}
