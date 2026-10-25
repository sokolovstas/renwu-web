/** Phone keyboard is much taller than the mobile URL bar. */
export const KEYBOARD_INSET_THRESHOLD_PX = 150;

export interface VisualViewportSnapshot {
  width: number;
  height: number;
  offsetTop: number;
  innerHeight: number;
  innerWidth: number;
}

export interface KeyboardViewportState {
  /** Narrow layout and the visual viewport lost a keyboard-sized band. */
  open: boolean;
  /** Bottom of the layout viewport covered by the keyboard, in px. */
  inset: number;
  /** visualViewport.height while open, otherwise the layout height. */
  height: number;
  /** visualViewport.offsetTop while open, otherwise 0. */
  offsetTop: number;
}

/**
 * iOS keeps the layout viewport full height when the keyboard opens.
 * The visible band is visualViewport. `height` shrinks by roughly the
 * keyboard; `offsetTop` is how far that band has been pushed down.
 */
export function keyboardViewportState(
  viewport: VisualViewportSnapshot,
  narrow: boolean,
): KeyboardViewportState {
  const height = Math.max(0, Math.round(viewport.height));
  const offsetTop = Math.max(0, Math.round(viewport.offsetTop));
  const innerHeight = Math.max(0, Math.round(viewport.innerHeight));
  const covered = Math.max(0, innerHeight - height);
  const open = narrow && covered >= KEYBOARD_INSET_THRESHOLD_PX;
  return {
    open,
    inset: open ? Math.max(0, innerHeight - offsetTop - height) : 0,
    height: open ? height : innerHeight,
    offsetTop: open ? offsetTop : 0,
  };
}
