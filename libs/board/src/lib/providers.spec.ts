jest.mock('@renwu/core', () => ({}));

import { APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RwBoardService } from './board.service';
import { provideRenwuBoards } from './providers';

describe('provideRenwuBoards', () => {
  it('registers a multi APP_INITIALIZER provider', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRenwuBoards(),
        { provide: RwBoardService, useValue: { init: jest.fn(() => of(undefined)) } },
      ],
    });

    const initializers = TestBed.inject(APP_INITIALIZER);

    // provideRenwuBoards() registers its own APP_INITIALIZER alongside
    // whatever else the app registers (e.g. i18n preloading) — assert our
    // provider contributed one, not that it's the only one in the app.
    expect(Array.isArray(initializers)).toBe(true);
    expect(initializers.length).toBeGreaterThanOrEqual(1);
    expect(initializers.every((fn) => typeof fn === 'function')).toBe(true);
  });

  it('the registered initializer awaits RwBoardService.init() exactly once', async () => {
    const init = jest.fn(() => of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideRenwuBoards(),
        { provide: RwBoardService, useValue: { init } },
      ],
    });

    // Angular's root ApplicationInitStatus runs every registered
    // APP_INITIALIZER exactly once as part of app bootstrap; resolving it
    // here exercises the real init flow end to end.
    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('propagates a failing RwBoardService.init() as a rejected bootstrap', async () => {
    const error = new Error('boom');
    const init = jest.fn(() => {
      throw error;
    });

    TestBed.configureTestingModule({
      providers: [
        provideRenwuBoards(),
        { provide: RwBoardService, useValue: { init } },
      ],
    });

    await expect(
      TestBed.inject(ApplicationInitStatus).donePromise,
    ).rejects.toBe(error);
  });
});
