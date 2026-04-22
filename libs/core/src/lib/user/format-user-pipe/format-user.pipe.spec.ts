import { TestBed } from '@angular/core/testing';
import { User } from '../user.model';
import { RwUserService } from '../user.service';
import { RwFormatUserPipe } from './format-user.pipe';

describe('RwFormatUserPipe', () => {
  let pipe: RwFormatUserPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwFormatUserPipe,
        { provide: RwUserService, useValue: { getUser: () => null } },
      ],
    });
    pipe = TestBed.inject(RwFormatUserPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('empty array', () => {
    expect(pipe.transform([])).toBe('❉ Team');
    expect(pipe.transform(null)).toBe('-');
  });

  it('one user', () => {
    expect(pipe.transform({})).toBe('-');
    expect(pipe.transform({ full_name: 'Test', username: 'test' })).toBe(
      'Test',
    );
    expect(pipe.transform({ username: 'test' })).toBe('test');
  });

  it('user array', () => {
    expect(
      pipe.transform(['User 1', 'User 2'] as unknown as User[]),
    ).toBe('-');
    expect(
      pipe.transform([
        { username: 'test1' },
        { full_name: 'Test 2', username: 'test2' },
      ]),
    ).toBe('test1, Test 2');
  });
});
