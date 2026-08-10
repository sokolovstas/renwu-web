import { TimelineIssue } from '../models/timeline-issue.model';

/** Matches `.td-col` horizontal padding (4px + 4px). */
const KEY_COL_PADDING_PX = 8;
/** Small slack so glyphs are not clipped at the edge. */
const KEY_COL_SLACK_PX = 2;
const KEY_COL_MIN_PX = 48;

const KEY_FONT_FAMILY = '"Open Sans", system-ui, sans-serif';

let measureCtx: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) {
    return measureCtx;
  }
  if (typeof document === 'undefined') {
    measureCtx = null;
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}

/** Collects issue keys from the full tree (ignores expand state and group rows). */
export function collectTimelineIssueKeys(nodes: TimelineIssue[]): string[] {
  const keys: string[] = [];
  const walk = (n: TimelineIssue): void => {
    if (String(n.type) !== 'group') {
      const key = (n.key || '').trim();
      if (key) {
        keys.push(key);
      }
    }
    for (const child of n.childs || []) {
      walk(child);
    }
  };
  for (const node of nodes || []) {
    walk(node);
  }
  return keys;
}

/**
 * Pixel width for the timeline table key column so the longest key fits
 * at the given font size (Open Sans 500, matching `.td-key`).
 */
export function measureTimelineKeyColumnWidthPx(
  keys: string[],
  fontSizePx: number,
): number {
  const fontSize = Math.max(10, Math.round(fontSizePx || 12));
  const samples = keys.length ? keys : ['Key'];
  const ctx = getMeasureContext();
  let maxText = 0;

  if (ctx) {
    ctx.font = `500 ${fontSize}px ${KEY_FONT_FAMILY}`;
    for (const key of samples) {
      maxText = Math.max(maxText, ctx.measureText(key).width);
    }
  } else {
    const maxLen = Math.max(3, ...samples.map((k) => k.length));
    maxText = maxLen * fontSize * 0.65;
  }

  return Math.max(
    KEY_COL_MIN_PX,
    Math.ceil(maxText + KEY_COL_SLACK_PX) + KEY_COL_PADDING_PX,
  );
}
