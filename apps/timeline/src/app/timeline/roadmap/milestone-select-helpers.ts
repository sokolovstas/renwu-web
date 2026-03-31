import { Milestone } from '@renwu/core';
import { parseUtcLike } from '../date-helpers';
import { unixSecondsVirtual } from '../virtual-hours';

/** Horizontal positions for milestone markers (planned/date end vs overdue/actual). */
export function milestoneBarGeometry(
  m: Milestone,
  dateStart: Date,
  scale: number,
  hours24InDay: boolean,
): {
  due: boolean;
  plannedPx: number;
  actualPx: number;
  leftPx: number;
  rightPx: number;
  linkWidthPx: number;
} | null {
  if (!m?.id || !dateStart || !scale) return null;
  const dateCalc = m.date_calc ? parseUtcLike(m.date_calc) : null;
  const date = m.date ? parseUtcLike(m.date) : null;
  const h24 = hours24InDay;
  const origin = unixSecondsVirtual(dateStart, h24, '');
  const calcOffset = dateCalc
    ? Math.floor(
        (unixSecondsVirtual(dateCalc, h24, '') - origin) / scale,
      )
    : 0;
  const dateOffset = date
    ? Math.floor((unixSecondsVirtual(date, h24, '') - origin) / scale)
    : calcOffset;
  const due = calcOffset > dateOffset;
  const plannedPx = dateOffset;
  const actualPx = calcOffset;
  const leftPx = Math.min(plannedPx, actualPx);
  const rightPx = Math.max(plannedPx, actualPx);
  const linkWidthPx = Math.abs(actualPx - plannedPx);
  return { due, plannedPx, actualPx, leftPx, rightPx, linkWidthPx };
}

export function milestoneSelectPayload(
  m: Milestone,
  dateStart: Date,
  scale: number,
  hours24InDay: boolean,
): { id: string; offset: number; due: boolean } | null {
  if (!m?.id) return null;
  const g = milestoneBarGeometry(m, dateStart, scale, hours24InDay);
  if (!g) return null;
  return {
    id: m.id,
    offset: g.rightPx,
    due: g.due,
  };
}
