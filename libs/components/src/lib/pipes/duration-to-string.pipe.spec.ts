import { DurationToStringPipe } from './duration-to-string.pipe';

describe('DurationToStringPipe', () => {
  it('create an instance', () => {
    const pipe = new DurationToStringPipe();
    expect(pipe).toBeTruthy();
  });
  it('format', () => {
    const pipe = new DurationToStringPipe();
    expect(pipe.transform('PT2H5M30S', 'hh:mm')).toBe('02:05');
    expect(pipe.transform('PT3H7M30S', 'hh:mm:ss')).toBe('03:07:30');
    expect(pipe.transform('PT3H7M30S')).toBe('3 hours 7 minutes 30 seconds');
  });
});
