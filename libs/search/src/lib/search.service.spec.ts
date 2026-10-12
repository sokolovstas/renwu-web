import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import { RwDataService, RwUserService } from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { RenwuSearchService } from './search.service';

describe('RenwuSearchService', () => {
  let service: RenwuSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
      ],
    });
    service = TestBed.inject(RenwuSearchService);
  });

  it('opens and closes the spotlight overlay', () => {
    expect(service.isOverlayOpen).toBe(false);
    service.showOverlay();
    expect(service.isOverlayOpen).toBe(true);
    service.hideOverlay();
    expect(service.isOverlayOpen).toBe(false);
  });

  it('keeps the query when opening an issue', () => {
    const sidebar = TestBed.inject(RenwuSidebarService);
    spyOn(sidebar, 'setCurrentTask');
    service.setQuery('alpha');
    service.showOverlay();
    service.openItem({
      id: 'ISSUE-1',
      kind: 'issue',
      group: 'issues',
      groupOrder: 0,
      title: 'Alpha',
      issue: { id: '1', key: 'ISSUE-1' } as never,
    });
    expect(sidebar.setCurrentTask).toHaveBeenCalled();
    expect(service.query.getValue()).toBe('alpha');
    expect(service.isOverlayOpen).toBe(false);
  });

  it('toggles overlay on Ctrl/Alt/Option+Space', () => {
    expect(service.isOverlayOpen).toBe(false);
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        altKey: true,
        bubbles: true,
      }),
    );
    expect(service.isOverlayOpen).toBe(true);
  });
});
