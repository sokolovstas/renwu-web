import { TestBed } from '@angular/core/testing';

import { BoardService } from './board.service';

describe('BoardService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [],
    }),
  );

  it('should be created', () => {
    const service: BoardService = TestBed.inject(BoardService);
    expect(service).toBeTruthy();
  });
});
