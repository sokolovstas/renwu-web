import { TestBed } from '@angular/core/testing';
import {
  BoardGroupsConfigServer,
  RwDataService,
  RwUserService,
} from '@renwu/core';
import { firstValueFrom, of } from 'rxjs';
import { RwBoardService } from './board.service';

describe('RwBoardService', () => {
  const serverBoard: BoardGroupsConfigServer = {
    id: 'b1',
    title: 'B',
    groups: [
      {
        field: 'status',
        view: 'columns',
        fixed: [],
        group_only: false,
        show_empty: true,
      },
    ],
    view: 'cards-v',
    type: 'card',
    shared: false,
    author_id: 'u1',
    show_logs: false,
    hide_parents: false,
    collapse_empty: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwBoardService,
        {
          provide: RwDataService,
          useValue: {
            getBoards: jest.fn().mockReturnValue(of([serverBoard])),
            saveBoard: jest
              .fn()
              .mockImplementation((b: BoardGroupsConfigServer) => of(b)),
            addBoard: jest
              .fn()
              .mockImplementation((b: BoardGroupsConfigServer) => of(b)),
            deleteBoard: jest.fn().mockReturnValue(of({ ok: true })),
          },
        },
        {
          provide: RwUserService,
          useValue: { getId: jest.fn().mockReturnValue('u1') },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(RwBoardService)).toBeTruthy();
  });

  it('getBoard should emit matching board', async () => {
    const svc = TestBed.inject(RwBoardService);
    await firstValueFrom(svc.loadBoards());
    const board = await firstValueFrom(svc.getBoard('b1'));
    expect(board.id).toBe('b1');
  });

  it('saveBoard should call data service and refresh list', async () => {
    const data = TestBed.inject(RwDataService);
    const svc = TestBed.inject(RwBoardService);
    await firstValueFrom(svc.loadBoards());
    const board = await firstValueFrom(svc.getBoard('b1'));
    await firstValueFrom(svc.saveBoard(board));
    expect(data.saveBoard).toHaveBeenCalled();
    expect(data.getBoards).toHaveBeenCalled();
  });

  it('addBoard should fill author id before saving', async () => {
    const data = TestBed.inject(RwDataService);
    const svc = TestBed.inject(RwBoardService);
    await firstValueFrom(svc.loadBoards());
    const board = await firstValueFrom(svc.getBoard('b1'));
    board.authorId = undefined;
    await firstValueFrom(svc.addBoard(board));
    expect(data.addBoard).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: 'u1' }),
    );
  });
});
