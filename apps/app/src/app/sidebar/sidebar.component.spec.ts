import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwSidebarService } from '@renwu/app-ui';
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
import {
  loadSidebarRecents,
  partitionSidebarSections,
  rememberSidebarSection,
  saveSidebarRecents,
  SIDEBAR_RECENT_LIMIT,
  SIDEBAR_RECENTS_STORAGE_KEY,
} from './sidebar-overflow';

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
        { provide: RwSidebarService, useValue: {} },
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

describe('partitionSidebarSections', () => {
  const sections = [
    { path: '' },
    { path: 'project' },
    { path: 'board' },
    { path: 'task' },
    { path: 'search' },
    { path: 'document' },
    { path: 'messenger' },
    { path: 'timeline' },
    { path: undefined, tour: 'add-task' },
  ];

  it('shows every section in the original order when the row can hold them', () => {
    const split = partitionSidebarSections(
      sections,
      Number.POSITIVE_INFINITY,
      'task',
      ['document'],
    );

    expect(split.visible.map((section) => section.path)).toEqual(
      sections.map((section) => section.path),
    );
    expect(split.overflow).toEqual([]);
  });

  it('pins dashboard and chat on the left and puts the newest recent on the right', () => {
    const split = partitionSidebarSections(sections, 6, 'project', [
      'document',
      'board',
      'search',
    ]);

    expect(split.visible.map((section) => section.path)).toEqual([
      '',
      'messenger',
      'board',
      'document',
      'project',
    ]);
    expect(split.visible).toHaveLength(5);
    expect(split.overflow.map((section) => section.path)).not.toContain('');
    expect(split.overflow.map((section) => section.path)).not.toContain(
      'messenger',
    );
    expect(split.overflow.map((section) => section.path)).toEqual([
      'task',
      'search',
      'timeline',
      undefined,
    ]);
  });

  it('drops the oldest recent into the menu when a newer one takes the right slot', () => {
    const split = partitionSidebarSections(sections, 6, 'timeline', [
      'search',
      'document',
      'board',
    ]);

    expect(split.visible.map((section) => section.path)).toEqual([
      '',
      'messenger',
      'document',
      'search',
      'timeline',
    ]);
    expect(split.overflow.map((section) => section.path)).toContain('board');
    expect(split.overflow.map((section) => section.path)).not.toContain(
      'timeline',
    );
  });

  it('does not fill empty recent slots with sections that were never opened', () => {
    const split = partitionSidebarSections(sections, 6, '', []);

    expect(split.visible.map((section) => section.path)).toEqual([
      '',
      'messenger',
    ]);
    expect(split.overflow.map((section) => section.path)).toEqual([
      'project',
      'board',
      'task',
      'search',
      'document',
      'timeline',
      undefined,
    ]);
  });
});

describe('sidebar recents', () => {
  it('stores the newest visit first and skips pinned sections', () => {
    const afterTask = rememberSidebarSection([], { path: 'task' });
    const afterDashboard = rememberSidebarSection(afterTask, { path: '' });
    const afterChat = rememberSidebarSection(afterDashboard, {
      path: 'messenger',
    });
    const afterDocument = rememberSidebarSection(afterChat, {
      path: 'document',
    });
    const again = rememberSidebarSection(afterDocument, { path: 'task' });

    expect(afterDashboard).toEqual(['task']);
    expect(afterChat).toEqual(['task']);
    expect(again).toEqual(['task', 'document']);
  });

  it('caps the stored list and round-trips through storage', () => {
    const storage = new Map<string, string>();
    const fake: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    };
    let recents: string[] = [];
    for (let index = 0; index < SIDEBAR_RECENT_LIMIT + 3; index++) {
      recents = rememberSidebarSection(recents, { path: `s${index}` });
    }
    saveSidebarRecents(recents, fake);

    expect(recents).toHaveLength(SIDEBAR_RECENT_LIMIT);
    expect(recents[0]).toBe(`s${SIDEBAR_RECENT_LIMIT + 2}`);
    expect(storage.get(SIDEBAR_RECENTS_STORAGE_KEY)).toBeTruthy();
    expect(loadSidebarRecents(fake)).toEqual(recents);
    expect(loadSidebarRecents({ getItem: () => '{nope' })).toEqual([]);
  });
});
