import { RwDurationToStringPipe } from './duration-to-string.pipe';

describe('RwDurationToStringPipe', () => {
  it('create an instance', () => {
    expect(new RwDurationToStringPipe()).toBeTruthy();
  });

  it('returns dash for zero', () => {
    const pipe = new RwDurationToStringPipe();
    expect(pipe.transform(0, 'normalize')).toBe('-');
  });
});
