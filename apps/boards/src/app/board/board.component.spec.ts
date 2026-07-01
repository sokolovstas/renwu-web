import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  BoardGroup,
  BoardGroupConfig,
  BoardGroupsConfig,
  RwBoardService,
  RwGroupService,
} from '@renwu/board';
import {
  ListOptions,
  RwDataService,
  RwContainerService,
  RwQueryBuilderService,
  RwSearchService,
  RwUserService,
  RwWebsocketService,
} from '@renwu/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    const mockGroup = new BoardGroup(new BoardGroupConfig());
    const mockBoard = BoardGroupsConfig.fromServer({
      id: '1',
      title: 'T',
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
    });
    const containers$ = new BehaviorSubject([{ id: 'c1', key: 'p', title: 'P' }]);
    const listOptions$ = new BehaviorSubject(new ListOptions('closed="false"'));
    const issueEvents = new Subject<{
      type: string;
      container: string;
      issues: string[];
    }>();

    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwBoardService,
          useValue: {
            getBoard: jest.fn().mockReturnValue(of(mockBoard)),
          },
        },
        {
          provide: RwSearchService,
          useValue: {
            listOptions: listOptions$,
            setListOptions: jest.fn((options: ListOptions) =>
              listOptions$.next(options),
            ),
            updateQuery: jest.fn((query: string) => {
              const options = new ListOptions(query);
              options.hash = 'h1';
              listOptions$.next(options);
            }),
            search: jest
              .fn()
              .mockReturnValue(of({ issues: [{ id: 'i1', container: { id: 'c1' } }] })),
          },
        },
        {
          provide: RwQueryBuilderService,
          useValue: {},
        },
        {
          provide: RwDataService,
          useValue: { saveIssue: jest.fn().mockReturnValue(of({})) },
        },
        {
          provide: RwContainerService,
          useValue: { containers: containers$ },
        },
        {
          provide: RwWebsocketService,
          useValue: { issue: issueEvents },
        },
        {
          provide: RwUserService,
          useValue: { getUsername: jest.fn().mockReturnValue('me') },
        },
        {
          provide: RwGroupService,
          useValue: {
            loadDictionaries: jest.fn().mockReturnValue(of([])),
            group: jest.fn().mockReturnValue(of(mockGroup)),
          },
        },
        {
          provide: RenwuSidebarService,
          useValue: {
            currentTask: new BehaviorSubject(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
