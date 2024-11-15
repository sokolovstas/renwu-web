import { async } from '@angular/core/testing';
import { FormatUserPipe } from './shared/pipes/format-user.pipe';

describe('FormatUserPipe', () => {
  let pipe: FormatUserPipe;

  beforeEach(async(() => {
    pipe = new FormatUserPipe();
  }));

  it('create an instance', () => {
    pipe = new FormatUserPipe();
    expect(pipe).toBeTruthy();
  });

  it('empty array', () => {
    expect(pipe.transform([])).toBe('❉ Team');
    expect(pipe.transform(null)).toBe('❉ Team');
  });

  it('one user', () => {
    expect(pipe.transform({})).toBe('-');
    expect(pipe.transform({ full_name: 'Test', username: 'test' })).toBe(
      'Test',
    );
    expect(pipe.transform({ username: 'test' })).toBe('test');
  });

  it('user array', () => {
    expect(pipe.transform(['User 1', 'User 2'])).toBe('User 1, User 2');
    expect(
      pipe.transform([
        { username: 'test1' },
        { full_name: 'Test 2', username: 'test2' },
      ]),
    ).toBe('test1, Test 2');
  });
});
