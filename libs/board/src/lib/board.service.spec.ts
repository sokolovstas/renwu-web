import { TestBed } from '@angular/core/testing';
import { RwDataService, RwSettingsService } from '@renwu/core';
import { of } from 'rxjs';
import { RwBoardService } from './board.service';

describe('RwBoardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwBoardService,
        {
          provide: RwDataService,
          useValue: { getBoards: jest.fn().mockReturnValue(of([])) },
        },
        { provide: RwSettingsService, useValue: { user: {} } },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(RwBoardService)).toBeTruthy();
  });
});
