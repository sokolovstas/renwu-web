import { TimelineIssue } from './models/timeline-issue.model';

/** Rows rendered for this node (self + visible descendants), same rules as templates (`_SHOWCHILDS`). */
export function countVisibleTimelineRows(node: TimelineIssue): number {
  if (!node) return 0;
  let n = 1;
  if (node._SHOWCHILDS !== false && node.childs?.length) {
    for (const c of node.childs) {
      n += countVisibleTimelineRows(c);
    }
  }
  return n;
}

/** Sum of `countVisibleTimelineRows` for `parent.childs[0..childIndex)`. */
export function visibleRowsBeforeChild(
  parent: TimelineIssue,
  childIndex: number,
): number {
  const childs = parent.childs;
  if (!childs || childIndex <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < childIndex; i++) {
    sum += countVisibleTimelineRows(childs[i]);
  }
  return sum;
}
