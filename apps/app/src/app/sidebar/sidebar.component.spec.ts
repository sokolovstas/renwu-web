import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  Instance,
  RW_CORE_SETTINGS,
  RwDataService,
  RwSiteDataService,
  RwUserService,
} from '@renwu/core';
import { RwMessageService } from '@renwu/messaging';
import { BehaviorSubject, of } from 'rxjs';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        {
          provide: RW_CORE_SETTINGS,
          useValue: { siteLoginUrl: '/login', siteVersion: '' },
        },
        {
          provide: RwDataService,
          useValue: { getVersion: () => of('0.0.0') },
        },
        {
          provide: RwSiteDataService,
          useValue: {
            getInstances: () => of([] as Instance[]),
            logout: () => of(undefined),
            changeInstance: () => of(undefined),
          },
        },
        {
          provide: RwUserService,
          useValue: { todos: of([]) },
        },
        { provide: RenwuSidebarService, useValue: {} },
        {
          provide: RwMessageService,
          useValue: {
            connected: new BehaviorSubject(true),
            unreadTodos: of(0),
            unreadMessenger: of(0),
          },
        },
      ],
    })
      .overrideComponent(SidebarComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
