import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwPolicyService } from '@renwu/core';
import { of } from 'rxjs';
import { RwSidebarService } from './sidebar.service';

describe('RwSidebarService', () => {
  let service: RwSidebarService;
  let router: {
    events: ReturnType<typeof of>;
    url: string;
    parseUrl: jest.Mock;
    navigate: jest.Mock;
  };

  beforeEach(() => {
    router = {
      events: of(),
      url: '/',
      parseUrl: jest.fn().mockReturnValue({ root: { children: {} } }),
      navigate: jest.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        RwSidebarService,
        { provide: Router, useValue: router },
        {
          provide: TranslocoService,
          useValue: { selectTranslate: () => of('') },
        },
        {
          provide: RwPolicyService,
          useValue: { canEditTenantSettings: () => of(true) },
        },
      ],
    });

    service = TestBed.inject(RwSidebarService);
  });

  it('exposes documents in the main sidebar', (done) => {
    service.sidebarSections.subscribe((sections) => {
      const docs = sections.find((section) => section.path === 'document');
      expect(docs).toBeTruthy();
      expect(docs?.place).toBe('sidebar');
      expect(docs?.icon).toBe('document');
      done();
    });
  });

  it('navigates to search as a regular page', (done) => {
    service.sidebarSections.subscribe((sections) => {
      const search = sections.find((section) => section.path === 'search');
      expect(search).toBeTruthy();
      expect(search?.place).toBe('sidebar');
      expect(search?.icon).toBe('search');
      expect(
        (search as { action?: string } | undefined)?.action,
      ).toBeUndefined();
      done();
    });
  });

  it('closes the section outlet and returns to the main view', () => {
    router.url = '/board/(section:task/P-1)';
    router.parseUrl.mockReturnValue({
      root: { children: { section: {} } },
    });
    const scrollSpy = jest.spyOn(service, 'scrollToMain');
    service.currentTask.next({ key: 'P-1' } as never);

    service.closeSection();

    expect(service.currentTask.getValue()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([{ outlets: { section: null } }]);
    return router.navigate.mock.results[0].value.then(() => {
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  it('does not navigate when the section outlet is closed', () => {
    service.closeSection();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('closes the section outlet on Escape', () => {
    router.url = '/board/(section:task/P-1)';
    router.parseUrl.mockReturnValue({
      root: { children: { section: {} } },
    });

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
      }),
    );

    expect(router.navigate).toHaveBeenCalledWith([{ outlets: { section: null } }]);
  });

  it('does not close the section on Escape when default is prevented', () => {
    router.url = '/board/(section:task/P-1)';
    router.parseUrl.mockReturnValue({
      root: { children: { section: {} } },
    });
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    window.dispatchEvent(event);

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
