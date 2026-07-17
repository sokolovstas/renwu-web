import { parseUtcLike } from '../date-helpers';
import { TimelineIssue } from '../models/timeline-issue.model';
import {
  countVisibleTimelineRows,
  flattenVisibleTimelinePreorder,
} from '../row-striping';
import { unixSecondsVirtual } from '../virtual-hours';

export interface TimelineParentScopeLayout {
  parentId: string;
  depth: number;
  topPx: number;
  heightPx: number;
  leftPx: number;
  widthPx: number;
  /** Issue ids included in this scope (parent + visible descendants). */
  issueIds: string[];
}

const SCOPE_HORIZONTAL_PAD_PX = 4;
const SCOPE_MIN_WIDTH_PX = 8;

function collectVisibleScopeIssueIds(node: TimelineIssue): string[] {
  const ids: string[] = [];
  const walk = (n: TimelineIssue): void => {
    if (String(n.type) === 'group') {
      if (n._SHOWCHILDS !== false && n.childs?.length) {
        for (const c of n.childs) {
          walk(c);
        }
      }
      return;
    }
    if (n.id !== undefined && n.id !== null && String(n.id).length > 0) {
      ids.push(String(n.id));
    }
    if (n._SHOWCHILDS !== false && n.childs?.length) {
      for (const c of n.childs) {
        walk(c);
      }
    }
  };
  walk(node);
  return ids;
}

function collectVisibleScopeDateBounds(
  node: TimelineIssue,
  hours24InDay: boolean,
): { minUnix: number | null; maxUnix: number | null } {
  let minUnix: number | null = null;
  let maxUnix: number | null = null;

  const visit = (n: TimelineIssue): void => {
    if (String(n.type) === 'group') {
      if (n._SHOWCHILDS !== false && n.childs?.length) {
        for (const c of n.childs) {
          visit(c);
        }
      }
      return;
    }

    const start = parseUtcLike(n.date_start_calc);
    const end = parseUtcLike(n.date_end_calc);
    if (start) {
      const v = unixSecondsVirtual(start, hours24InDay, 'start');
      minUnix = minUnix === null ? v : Math.min(minUnix, v);
    }
    if (end) {
      const v = unixSecondsVirtual(end, hours24InDay, 'end');
      maxUnix = maxUnix === null ? v : Math.max(maxUnix, v);
    }

    if (n._SHOWCHILDS !== false && n.childs?.length) {
      for (const c of n.childs) {
        visit(c);
      }
    }
  };

  visit(node);
  return { minUnix, maxUnix };
}

function hasVisibleChildIssues(node: TimelineIssue): boolean {
  if (!node.childs?.length || node._SHOWCHILDS === false) {
    return false;
  }
  for (const child of node.childs) {
    if (String(child.type) !== 'group') {
      return true;
    }
    if (hasVisibleChildIssues(child)) {
      return true;
    }
  }
  return false;
}

/** Builds absolute-positioned parent scope boxes for the graph column. */
export function buildTimelineParentScopeLayouts(
  roots: TimelineIssue[],
  options: {
    dateStart: Date;
    scale: number;
    hours24InDay: boolean;
    issueRowHeightPx: number;
    roadmapBandHeightPx: number;
  },
): TimelineParentScopeLayout[] {
  if (!roots?.length || !options.scale) {
    return [];
  }

  const flat = flattenVisibleTimelinePreorder(roots);
  const rowById = new Map<string, number>();
  flat.forEach((node, index) => {
    if (String(node.type) === 'group') {
      return;
    }
    const id = node.id;
    if (id !== undefined && id !== null && String(id).length > 0) {
      rowById.set(String(id), index);
    }
  });

  const origin = unixSecondsVirtual(options.dateStart, options.hours24InDay, '');
  const layouts: TimelineParentScopeLayout[] = [];

  const walk = (node: TimelineIssue, depth: number): void => {
    const isIssue =
      String(node.type) !== 'group' &&
      node.id !== undefined &&
      node.id !== null &&
      String(node.id).length > 0;

    if (
      isIssue &&
      node.childs?.length &&
      node._SHOWCHILDS !== false &&
      hasVisibleChildIssues(node)
    ) {
      const parentId = String(node.id);
      const rowIndex = rowById.get(parentId);
      if (rowIndex !== undefined) {
        const rowSpan = countVisibleTimelineRows(node);
        const { minUnix, maxUnix } = collectVisibleScopeDateBounds(
          node,
          options.hours24InDay,
        );

        if (minUnix !== null && maxUnix !== null && maxUnix >= minUnix) {
          const leftPx =
            (minUnix - origin) / options.scale - SCOPE_HORIZONTAL_PAD_PX;
          const rightPx =
            (maxUnix - origin) / options.scale + SCOPE_HORIZONTAL_PAD_PX;

          layouts.push({
            parentId,
            depth,
            topPx: options.roadmapBandHeightPx + rowIndex * options.issueRowHeightPx,
            heightPx: rowSpan * options.issueRowHeightPx,
            leftPx,
            widthPx: Math.max(
              SCOPE_MIN_WIDTH_PX,
              rightPx - leftPx,
            ),
            issueIds: collectVisibleScopeIssueIds(node),
          });
        }
      }
    }

    if (node._SHOWCHILDS !== false && node.childs?.length) {
      for (const child of node.childs) {
        walk(child, isIssue ? depth + 1 : depth);
      }
    }
  };

  for (const root of roots) {
    walk(root, 0);
  }

  return layouts.sort((a, b) => a.depth - b.depth);
}
