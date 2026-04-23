import { TestBed } from '@angular/core/testing';
import { RwContainerService } from '@renwu/core';
import { SortListPipe } from './sort-list.pipe';

describe('SortListPipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SortListPipe,
        {
          provide: RwContainerService,
          useValue: {
            currentContainer: { settings: {} },
          },
        },
      ],
    });
  });

  it('should create', () => {
    expect(TestBed.inject(SortListPipe)).toBeTruthy();
  });
});
