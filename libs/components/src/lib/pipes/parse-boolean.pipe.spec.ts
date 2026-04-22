import { RwParseBooleanPipe } from './parse-boolean.pipe';

describe('RwParseBooleanPipe', () => {
  it('create an instance', () => {
    const pipe = new RwParseBooleanPipe();
    expect(pipe).toBeTruthy();
    expect(pipe.transform('true')).toBeTruthy();
    expect(pipe.transform('1')).toBeTruthy();
    expect(pipe.transform(1)).toBeTruthy();
    expect(pipe.transform('True')).toBeTruthy();
    expect(pipe.transform('TRUE')).toBeTruthy();

    expect(pipe.transform('false')).toBeFalsy();
    expect(pipe.transform('0')).toBeFalsy();
    expect(pipe.transform(0)).toBeFalsy();
    expect(pipe.transform('False')).toBeFalsy();
    expect(pipe.transform('FALSE')).toBeFalsy();
  });
});
