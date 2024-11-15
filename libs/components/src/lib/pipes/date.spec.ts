import { format, formatISO, getUnixTime } from 'date-fns';
import { DatePipe } from './date.pipe';

describe('DatePipe', () => {
  it('create an instance', () => {
    const pipe = new DatePipe();
    expect(pipe).toBeTruthy();
  });
  it('allow null and undefined', () => {
    const pipe = new DatePipe();
    expect(pipe.transform(undefined)).toBe('---');
    expect(pipe.transform(null)).toBe('---');
  });
  it('parse unix and json time', () => {
    const pipe = new DatePipe();
    expect(pipe.transform(getUnixTime(new Date()))).toBe(
      format(new Date(), 'PPP'),
    );
    expect(pipe.transform(formatISO(new Date()))).toBe(
      format(new Date(), 'PPP'),
    );
  });
  it('support custom format', () => {
    const pipe = new DatePipe();
    expect(pipe.transform(getUnixTime(new Date()), 'PPP pppp')).toBe(
      format(new Date(), 'PPP pppp'),
    );
  });
});
