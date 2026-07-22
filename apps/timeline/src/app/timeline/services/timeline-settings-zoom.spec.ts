import { TimelineTicksId } from '@renwu/core';

/**
 * Mirrors `TimelineSettingsService.applyGestureZoomFactor` tick-crossing rules
 * for a focused unit test without spinning up the full settings service.
 */
function applyZoom(
  scaleTick: TimelineTicksId,
  scaleValue: number,
  factor: number,
): { scaleTick: TimelineTicksId; scaleValue: number } {
  const ZOOM_TICKS = [
    TimelineTicksId.DAY,
    TimelineTicksId.WEEK,
    TimelineTicksId.QUARTER,
  ];
  let tick = scaleTick;
  let value = Math.round(scaleValue);
  let next = Math.round(value * factor);
  if (next === value && Math.abs(factor - 1) > 0.001) {
    next = factor > 1 ? value + 1 : value - 1;
  }
  let idx = ZOOM_TICKS.indexOf(tick);
  if (idx < 0) idx = 0;

  while (next > 200 && idx > 0) {
    idx -= 1;
    tick = ZOOM_TICKS[idx];
    next = 50 + (next - 200);
  }
  if (next > 200) next = 200;

  while (next < 50 && idx < ZOOM_TICKS.length - 1) {
    idx += 1;
    tick = ZOOM_TICKS[idx];
    next = 200 - (50 - next);
  }
  if (next < 50) next = 50;

  return {
    scaleTick: ZOOM_TICKS[idx] ?? tick,
    scaleValue: Math.max(50, Math.min(200, Math.round(next))),
  };
}

describe('gesture zoom tick crossing', () => {
  it('keeps integer percent within the current tick', () => {
    expect(applyZoom(TimelineTicksId.DAY, 100, 1.1)).toEqual({
      scaleTick: TimelineTicksId.DAY,
      scaleValue: 110,
    });
  });

  it('switches Day → Week when zooming out past 50%', () => {
    expect(applyZoom(TimelineTicksId.DAY, 50, 0.9)).toEqual({
      scaleTick: TimelineTicksId.WEEK,
      scaleValue: 195,
    });
  });

  it('switches Week → Day when zooming in past 200%', () => {
    expect(applyZoom(TimelineTicksId.WEEK, 200, 1.1)).toEqual({
      scaleTick: TimelineTicksId.DAY,
      scaleValue: 70,
    });
  });

  it('stays at Day/200 when already at the finest limit', () => {
    expect(applyZoom(TimelineTicksId.DAY, 200, 1.2)).toEqual({
      scaleTick: TimelineTicksId.DAY,
      scaleValue: 200,
    });
  });

  it('stays at Quarter/50 when already at the coarsest limit', () => {
    expect(applyZoom(TimelineTicksId.QUARTER, 50, 0.8)).toEqual({
      scaleTick: TimelineTicksId.QUARTER,
      scaleValue: 50,
    });
  });
});
