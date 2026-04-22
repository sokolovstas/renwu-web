import { RwTimeDistancePipe } from './distance.pipe';

describe('RwTimeDistancePipe', () => {
  it('create an instance', () => {
    expect(new RwTimeDistancePipe()).toBeTruthy();
  });

  it('allow null and undefined', () => {
    const pipe = new RwTimeDistancePipe();
    expect(pipe.transform(undefined)).toBe('---');
    expect(pipe.transform(null)).toBe('---');
    expect(pipe.transform('wegergrwerg')).toBe('---');
  });
});
