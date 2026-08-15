import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSearchOverlayService, RenwuSidebarService } from '@renwu/app-ui';
import { RwDataService, RwUserService } from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwDataService,
          useValue: {
            getContainers: () => of([]),
            searchHistory: () => of([]),
            quickSearch: () => of({ issues: [], hits: [] }),
          },
        },
        {
          provide: RwUserService,
          useValue: { userList: new BehaviorSubject([]) },
        },
        {
          provide: RenwuSidebarService,
          useValue: { setCurrentTask: () => undefined },
        },
        RenwuSearchOverlayService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
