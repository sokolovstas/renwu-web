import { TimelineIssue } from '../models/timeline-issue.model';
import { unixSecondsVirtual } from '../virtual-hours';
import { timelineIssueBarEnd, timelineIssueBarStart } from './timeline-bar-dates';

export interface TimelineLaneBar {
  id: string;
  title: string;
  left: number;
  width: number;
  color: string;
  issue: TimelineIssue;
}

export interface TimelineLaneContext {
  dateStart: Date;
  scale: number;
  hours24InDay: boolean;
}

/**
 * Bars for a collapsed group row: one segment per task, on the group's single line.
 * A parent is drawn only when none of its descendants have their own bar, so a
 * rollup span does not cover the tasks that already show the load.
 */
export function timelineGroupLaneBars(
  group: TimelineIssue,
  ctx: TimelineLaneContext,
): TimelineLaneBar[] {
  if (!ctx.scale) return [];
  const bars: TimelineLaneBar[] = [];
  for (const child of group.childs ?? []) {
    collectLaneBars(child, ctx, bars);
  }
  bars.sort((a, b) => a.left - b.left || b.width - a.width);
  return bars;
}

function collectLaneBars(
  node: TimelineIssue,
  ctx: TimelineLaneContext,
  out: TimelineLaneBar[],
): void {
  if (String(node.type) === 'group') {
    for (const child of node.childs ?? []) {
      collectLaneBars(child, ctx, out);
    }
    return;
  }

  const before = out.length;
  for (const child of node.childs ?? []) {
    collectLaneBars(child, ctx, out);
  }
  if (out.length > before) return;

  const bar = barForIssue(node, ctx);
  if (bar) out.push(bar);
}

function barForIssue(
  issue: TimelineIssue,
  ctx: TimelineLaneContext,
): TimelineLaneBar | null {
  const start = timelineIssueBarStart(issue);
  const end = timelineIssueBarEnd(issue);
  if (!start || !end) return null;

  const h24 = ctx.hours24InDay;
  const origin = unixSecondsVirtual(ctx.dateStart, h24, '');
  const startUnix = unixSecondsVirtual(start, h24, 'start');
  const endUnix = unixSecondsVirtual(end, h24, 'end');

  return {
    id: String(issue.id || issue.key || `${startUnix}-${endUnix}`),
    title: issue.title || issue.key || '',
    left: (startUnix - origin) / ctx.scale,
    width: Math.max((endUnix - startUnix) / ctx.scale, 5),
    color: issueBarColor(issue),
    issue,
  };
}

function issueBarColor(issue: TimelineIssue): string {
  const status = issue.status as { color?: string } | string | undefined;
  if (status && typeof status === 'object' && status.color) {
    return status.color;
  }
  const type = issue.type as { color?: string } | string | undefined;
  if (type && typeof type === 'object' && type.color) {
    return type.color;
  }
  return '#7c8ea3';
}
