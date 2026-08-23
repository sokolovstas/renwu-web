jest.mock('@renwu/core', () => ({
  RwDataService: class RwDataService {},
  RwSettingsService: class RwSettingsService {},
}));

import { TestBed } from '@angular/core/testing';
import { BoardGroupsConfigServer, RwDataService, RwSettingsService } from '@renwu/core';
import { Subject, of } from 'rxjs';
import { RwBoardService } from './board.service';

describe('RwBoardService', () => {
  let getBoards: jest.Mock;
  let service: RwBoardService;

  const serverBoard = (id: string, title: string): BoardGroupsConfigServer => ({
    id,
    title,
    groups: [],
    view: 'cards-v',
    type: 'card',
    shared: false,
    author_id: 'user-1',
    show_logs: false,
    hide_parents: false,
    collapse_empty: false,
  });

  beforeEach(() => {
    getBoards = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        RwBoardService,
        { provide: RwDataService, useValue: { getBoards } },
        { provide: RwSettingsService, useValue: {} },
      ],
    });
    service = TestBed.inject(RwBoardService);
  });

  it('starts with an empty boards list', () => {
    expect(service.boards.value).toEqual([]);
  });

  describe('loadBoards / init', () => {
    it('maps server boards into client BoardGroupsConfig instances and publishes them', (done) => {
      getBoards.mockReturnValue(
        of([serverBoard('b1', 'Sprint board'), serverBoard('b2', 'Roadmap')]),
      );

      service.loadBoards().subscribe(() => {
        expect(service.boards.value).toHaveLength(2);
        expect(service.boards.value.map((b) => b.id)).toEqual(['b1', 'b2']);
        expect(service.boards.value.map((b) => b.title)).toEqual([
          'Sprint board',
          'Roadmap',
        ]);
        done();
      });
    });

    it('init() delegates to loadBoards()', () => {
      getBoards.mockReturnValue(of([serverBoard('b1', 'Sprint board')]));

      service.init().subscribe();

      expect(getBoards).toHaveBeenCalledTimes(1);
      expect(service.boards.value).toHaveLength(1);
    });
  });

  describe('updateBoardsList', () => {
    it('re-fetches and republishes the boards list', () => {
      const subject = new Subject<BoardGroupsConfigServer[]>();
      getBoards.mockReturnValue(subject.asObservable());

      service.updateBoardsList();
      expect(service.boards.value).toEqual([]);

      subject.next([serverBoard('b3', 'Later board')]);

      expect(service.boards.value.map((b) => b.id)).toEqual(['b3']);
    });
  });

  describe('getBoard', () => {
    it('resolves the board with the given id from the current list', (done) => {
      getBoards.mockReturnValue(
        of([serverBoard('b1', 'Sprint board'), serverBoard('b2', 'Roadmap')]),
      );

      service.loadBoards().subscribe(() => {
        service.getBoard('b2').subscribe((board) => {
          expect(board.title).toBe('Roadmap');
          done();
        });
      });
    });

    it('resolves undefined for an unknown id', (done) => {
      getBoards.mockReturnValue(of([serverBoard('b1', 'Sprint board')]));

      service.loadBoards().subscribe(() => {
        service.getBoard('missing').subscribe((board) => {
          expect(board).toBeUndefined();
          done();
        });
      });
    });
  });
});
