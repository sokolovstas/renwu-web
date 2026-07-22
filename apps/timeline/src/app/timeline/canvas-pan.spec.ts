import { clampTimelinePan } from './canvas-pan';

describe('clampTimelinePan', () => {
  it('keeps panX inside the track when content is wider than the viewport', () => {
    expect(clampTimelinePan(50, 40, 1000, 400)).toEqual({
      x: 50,
      y: 40,
    });
  });

  it('clamps panX to zero but leaves panY free above content', () => {
    expect(clampTimelinePan(-20, -10, 1000, 400)).toEqual({
      x: 0,
      y: -10,
    });
  });

  it('clamps panX to max but leaves panY free past content', () => {
    expect(clampTimelinePan(9999, 9999, 1000, 400)).toEqual({
      x: 600,
      y: 9999,
    });
  });

  it('forces panX to zero when the track fits in the viewport', () => {
    expect(clampTimelinePan(80, 60, 300, 400)).toEqual({
      x: 0,
      y: 60,
    });
  });
});
