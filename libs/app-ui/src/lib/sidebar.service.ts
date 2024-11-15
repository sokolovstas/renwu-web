import { ElementRef, Injectable, inject } from '@angular/core';
import { Router, RouterEvent } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { IconName } from '@renwu/components';
import { Issue, RwPolicyService } from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';

export interface SidebarSection {
  icon: IconName;
  hint: Observable<string>;
  tour?: string;
  path?: string;
  url?: string[];
  scrollTo?: 'sidebar' | 'main' | 'section';
  outlet?: string;
  place: 'sidebar' | 'profile';
}

@Injectable({
  providedIn: 'root',
})
export class RenwuSidebarService {
  scrollValue = 0;
  transloco = inject(TranslocoService);
  policyService = inject(RwPolicyService);
  router = inject(Router);
  currentTask = new BehaviorSubject<Issue>(null);
  currentSection = new BehaviorSubject<SidebarSection>(null);
  lastRoutes: Record<string, string> = JSONUtils.parseLocalStorage(
    'renwu-last-routes',
    {},
  );
  scrollContainer: ElementRef;
  sections = new BehaviorSubject<SidebarSection[]>([
    {
      icon: 's-document',
      tour: 'dashboard',
      hint: this.transloco.selectTranslate('renwu.dashboard'),
      path: '',
      url: ['/'],
      place: 'sidebar',
    },
    {
      icon: 's-project',
      hint: this.transloco.selectTranslate('renwu.projects'),
      path: 'project',
      place: 'sidebar',
    },
    // { icon: 's-board', hint: this.transloco.selectTranslate('renwu.boards'), path: 'board', place: 'sidebar' },
    {
      icon: 's-task',
      hint: this.transloco.selectTranslate('renwu.tasks'),
      path: 'task',
      place: 'sidebar',
    },
    // {
    //   icon: 's-document',
    //   hint: this.transloco.selectTranslate('renwu.documents'),
    //   path: 'document',
    //   place: 'sidebar',
    // },
    {
      icon: 's-message',
      hint: this.transloco.selectTranslate('renwu.messenger'),
      path: 'messenger',
      place: 'sidebar',
    },
    {
      icon: 'add-bold',
      tour: 'add-task',
      hint: this.transloco.selectTranslate('renwu.add-task'),
      url: ['task', 'new'],
      scrollTo: 'section',
      outlet: 'section',
      place: 'sidebar',
    },
    // { icon: 's-todo', hint: this.transloco.selectTranslate('renwu.todo'), path: 'todo', place: 'sidebar' },
    {
      icon: 'settings',
      hint: this.transloco.selectTranslate('renwu.settings'),
      path: 'settings',
      place: 'profile',
    },
    {
      icon: 'user',
      hint: this.transloco.selectTranslate('renwu.profile'),
      path: 'profile',
      place: 'profile',
    },
  ]);

  sidebarSections = this.sections.pipe(
    map((s) => s.filter((i) => i.place === 'sidebar')),
  );
  profileSections = combineLatest([
    this.sections,
    of(null).pipe(switchMap(() => this.policyService.canEditTenantSettings())),
  ]).pipe(
    map(([s, canEditTenantSettings]) => {
      let sections = s.filter((i) => i.place === 'profile');
      if (!canEditTenantSettings) {
        sections = sections.filter((i) => i.path !== 'settings');
      }
      return sections;
    }),
  );

  constructor() {
    this.router.events
      .pipe(
        map((e) => (e as RouterEvent).url),
        filter((url) => !!url),
      )
      .subscribe((url) => {
        this.sections.getValue().forEach((s) => {
          if (url.indexOf(`/${s.path}`) === 0) {
            this.currentSection.next(s);
          }
        });
      });

    this.currentTask.subscribe((t) => {
      if (t && this.scrollContainer) {
        this.router.navigate([{ outlets: { section: ['task', t.key] } }]);
        setTimeout(() => {
          this.scrollToSection();
        }, 200);
      }
    });
  }
  init(scrollContainer: ElementRef) {
    this.scrollContainer = scrollContainer;
  }
  setSection(section: SidebarSection) {
    // Find and change current section lastURL
    const currentSection = this.sections
      .getValue()
      .find((s) => s.path === this.currentSection.getValue()?.path);

    if (currentSection.path === section.path) {
      this.scrollToggle();
    }

    if (currentSection) {
      const prevRoute = this.router
        .parseUrl(this.router.url)
        .root?.children['primary']?.toString();
      if (prevRoute?.indexOf(currentSection.path) === 0) {
        this.lastRoutes[currentSection.path] = prevRoute;
        JSONUtils.setLocalStorage('renwu-last-routes', this.lastRoutes);
      }
    }

    // Emit sections spread
    this.sections.next([...this.sections.getValue()]);

    if (section.path) {
      const nextRoute = this.lastRoutes[section.path];
      if (nextRoute && nextRoute.indexOf(section.path) === 0) {
        return this.router
          .navigate([{ outlets: { primary: this.lastRoutes[section.path] } }])
          .catch(() => {
            return this.router.navigate([
              { outlets: { primary: section.path } },
            ]);
          });
      }
    }

    if (section.scrollTo) {
      switch (section.scrollTo) {
        case 'sidebar':
          this.scrollToSidebar();
          break;
        case 'main':
          this.scrollToMain();
          break;
        case 'section':
          setTimeout(() => {
            this.scrollToSection();
          }, 200);
          break;
      }
    }

    if (section.url && section.outlet) {
      return this.router.navigate([
        { outlets: { [section.outlet]: section.url } },
      ]);
    }
    if (section.url && !section.outlet) {
      return this.router.navigate(section.url);
    }

    return this.router.navigate([{ outlets: { primary: section.path } }]);
  }

  scrollToSection() {
    const section = window.innerWidth * 2;
    if (this.scrollContainer?.nativeElement) {
      if (this.scrollValue === section) {
        return;
      }
      this.scrollValue = section;
      (this.scrollContainer.nativeElement as HTMLDivElement).scrollTo(
        window.innerWidth * 2,
        0,
      );
      setTimeout(() => {
        this.scrollValue = -1;
      }, 200);
    }
  }
  scrollToMain() {
    const main = window.innerWidth;
    if (this.scrollContainer?.nativeElement) {
      if (this.scrollValue === main) {
        return;
      }
      this.scrollValue = main;
      (this.scrollContainer.nativeElement as HTMLDivElement).scrollTo(
        window.innerWidth,
        0,
      );
      setTimeout(() => {
        this.scrollValue = -1;
      }, 200);
    }
  }
  scrollToSidebar() {
    const sidebar = 0;
    if (this.scrollContainer?.nativeElement) {
      if (this.scrollValue === sidebar) {
        return;
      }
      this.scrollValue = sidebar;
      (this.scrollContainer.nativeElement as HTMLDivElement).scrollTo(0, 0);
      setTimeout(() => {
        this.scrollValue = -1;
      }, 200);
    }
  }
  scrollToggle() {
    if (this.scrollContainer?.nativeElement) {
      if (
        (this.scrollContainer.nativeElement as HTMLDivElement).scrollLeft <
        window.innerWidth / 2
      ) {
        this.scrollToMain();
      } else if (
        (this.scrollContainer.nativeElement as HTMLDivElement).scrollLeft >
        window.innerWidth + window.innerWidth / 2
      ) {
        this.scrollToMain();
      } else if (
        (this.scrollContainer.nativeElement as HTMLDivElement).scrollLeft >
        window.innerWidth / 2
      ) {
        this.scrollToSidebar();
      }
    }
  }
}
