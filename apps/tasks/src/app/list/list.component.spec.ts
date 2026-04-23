import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  IssueTableService,
  ListOptions,
  RwDataService,
  RwQueryBuilderService,
  RwSearchService,
  RwWebsocketService,
} from '@renwu/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    const listOptions = new BehaviorSubject<ListOptions>(new ListOptions());
    const getRefreshedListMock = (_opts?: Observable<unknown>) => {
      return <T>(source: Observable<T>) =>
        source.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    };

    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideRouter([]),
        {
          provide: RenwuSidebarService,
          useValue: { currentTask: new BehaviorSubject(null) },
        },
        {
          provide: RwDataService,
          useValue: {
            getSearchQuery: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: RwWebsocketService,
          useValue: {
            clearId: jest.fn(),
            pushId: jest.fn(),
            sendView: jest.fn(),
            onIssueEvent: () => of({}),
          },
        },
      ],
    })
      .overrideComponent(ListComponent, {
        set: {
          template: '',
          imports: [],
          providers: [
            { provide: RwQueryBuilderService, useValue: {} },
            {
              provide: RwSearchService,
              useValue: {
                listOptions,
                setListOptions: jest.fn(),
                updateListOptions: jest.fn(),
                search: jest.fn().mockReturnValue(of({ issues: [] })),
                filterByBar: jest.fn(),
              },
            },
            {
              provide: IssueTableService,
              useValue: {
                getRefreshedList: getRefreshedListMock,
              },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ListComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
