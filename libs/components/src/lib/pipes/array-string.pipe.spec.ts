import { FormatArrayStringPipe } from './array-string.pipe';

describe('FormatArrayStringPipe', () => {
  it('create an instance', () => {
    const pipe = new FormatArrayStringPipe();
    expect(pipe).toBeTruthy();
  });
  it('create strng from array', () => {
    const pipe = new FormatArrayStringPipe();
    expect(pipe.transform(['1\n\n', '2\t', '3'])).toBe('1, 2, 3');
  });
  it('create strng from array with custom separator', () => {
    const pipe = new FormatArrayStringPipe();
    expect(pipe.transform(['1', '2', '3'], '-')).toBe('1-2-3');
  });
});
