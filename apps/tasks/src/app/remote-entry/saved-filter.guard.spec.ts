import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RwDataService } from '@renwu/core';
import { EMPTY, of } from 'rxjs';

import { checkEmptyFilter } from './saved-filter.guard';

@Component({ standalone: true, template: '' })
class OutletStub {}

describe('checkEmptyFilter', () => {
  async function navigate(
    getSearchQuery: jest.Mock,
    url: string,
  ): Promise<string> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'list',
            children: [
              { path: '', pathMatch: 'full', component: OutletStub },
              {
                path: ':id',
                canActivate: [checkEmptyFilter],
                component: OutletStub,
              },
            ],
          },
        ]),
        { provide: RwDataService, useValue: { getSearchQuery } },
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.url;
  }

  it('opens a saved filter by id without loading the whole list', async () => {
    const getSearchQuery = jest
      .fn()
      .mockReturnValue(of({ id: 'abc', query_string: 'completed = false' }));

    await expect(navigate(getSearchQuery, '/list/abc')).resolves.toBe(
      '/list/abc',
    );
    expect(getSearchQuery).toHaveBeenCalledWith('abc');
  });

  it('returns to the filters index when that id does not exist', async () => {
    const getSearchQuery = jest.fn().mockReturnValue(EMPTY);

    await expect(navigate(getSearchQuery, '/list/missing')).resolves.toBe(
      '/list',
    );
    expect(getSearchQuery).toHaveBeenCalledWith('missing');
  });
});
