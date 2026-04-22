import { RwDatePipe } from './date.pipe';

describe('RwDatePipe', () => {
  it('create an instance', () => {
    expect(new RwDatePipe()).toBeTruthy();
  });

  it('allow null and undefined', () => {
    const pipe = new RwDatePipe();
    expect(pipe.transform(undefined)).toBe('---');
    expect(pipe.transform(null)).toBe('---');
  });
});
