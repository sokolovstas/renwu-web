/**
 * Clamp camera X to the current date track.
 * Y is unrestricted: tasks pan freely; day grid is a separate full-height layer.
 */
export function clampTimelinePan(
  x: number,
  y: number,
  trackWidth: number,
  viewportWidth: number,
): { x: number; y: number } {
  const maxX = Math.max(0, trackWidth - viewportWidth);
  return {
    x: Math.min(maxX, Math.max(0, Math.floor(x))),
    y: Math.floor(y),
  };
}
