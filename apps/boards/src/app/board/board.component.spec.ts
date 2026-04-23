import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  BoardGroup,
  BoardGroupConfig,
  RwBoardService,
  RwGroupService,
} from '@renwu/board';
import { RwSearchService } from '@renwu/core';
import { of } from 'rxjs';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    const mockGroup = new BoardGroup(new BoardGroupConfig());
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwBoardService,
          useValue: {
            getBoard: jest.fn().mockReturnValue(of(undefined)),
          },
        },
        {
          provide: RwSearchService,
          useValue: {
            search: jest.fn().mockReturnValue(of({ issues: [] })),
          },
        },
      ],
    })
      .overrideComponent(BoardComponent, {
        set: {
          template: '',
          imports: [],
          providers: [
            {
              provide: RwGroupService,
              useValue: {
                group: jest.fn().mockReturnValue(of(mockGroup)),
              },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
