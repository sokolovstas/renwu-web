import { formatISO, getUnixTime } from 'date-fns';
import { TimeDistancePipe } from './distance.pipe';

describe('TimeDistancePipe', () => {
  it('create an instance', () => {
    const pipe = new TimeDistancePipe();
    expect(pipe).toBeTruthy();
  });
  it('allow null and undefined', () => {
    const pipe = new TimeDistancePipe();
    expect(pipe.transform(undefined)).toBe('---');
    expect(pipe.transform(null)).toBe('---');
    expect(pipe.transform('wegergrwerg')).toBe('---');
  });
  it('parse unix and json time', () => {
    const pipe = new TimeDistancePipe();
    expect(pipe.transform(getUnixTime(new Date()))).toBe('less than a minute');
    expect(pipe.transform(formatISO(new Date()))).toBe('less than a minute');
  });
});
