import { RwFormatArrayStringPipe } from './array-string.pipe';

describe('RwFormatArrayStringPipe', () => {
  it('create an instance', () => {
    const pipe = new RwFormatArrayStringPipe();
    expect(pipe).toBeTruthy();
  });
  it('create strng from array', () => {
    const pipe = new RwFormatArrayStringPipe();
    expect(pipe.transform(['1\n\n', '2\t', '3'])).toBe('1, 2, 3');
  });
  it('create strng from array with custom separator', () => {
    const pipe = new RwFormatArrayStringPipe();
    expect(pipe.transform(['1', '2', '3'], '-')).toBe('1-2-3');
  });
});
