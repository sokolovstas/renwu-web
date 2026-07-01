import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardGroupsConfig, RwBoardService } from '@renwu/board';
import { BehaviorSubject, of } from 'rxjs';

import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    const boards$ = new BehaviorSubject<BoardGroupsConfig[]>([]);

    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwBoardService,
          useValue: {
            boards: boards$,
            loadBoards: jest.fn().mockReturnValue(of([])),
            addBoard: jest.fn().mockReturnValue(
              of({
                id: 'b1',
                title: 'New board',
                groups: [],
                view: 'cards-v',
                type: 'card',
                shared: false,
                author_id: 'u1',
                show_logs: false,
                hide_parents: false,
                collapse_empty: false,
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
