import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import {
  Container,
  RwDataService,
  RwShortcutService,
  RwUserService,
  SearchResponse,
} from '@renwu/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  SearchItem,
  SearchView,
  buildSearchItems,
  flattenGroups,
  moveActiveIndex,
  toSearchView,
} from './search-results';

@Injectable({
  providedIn: 'root',
})
export class RenwuSearchService {
  private readonly dataService = inject(RwDataService);
  private readonly userService = inject(RwUserService);
  private readonly router = inject(Router);
  private readonly sidebarService = inject(RenwuSidebarService);
  private readonly shortcuts = inject(RwShortcutService);

  readonly overlayOpen = new BehaviorSubject(false);
  readonly overlayOpen$ = this.overlayOpen.asObservable();
  readonly query = new BehaviorSubject('');
  readonly activeIndex = new BehaviorSubject(0);

  private groups = toSearchView([]).groups;

  private readonly projects$: Observable<Container[]> = this.dataService
    .getContainers()
    .pipe(
      catchError(() => of([] as Container[])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  readonly view$: Observable<SearchView> = combineLatest([
    this.query.pipe(debounceTime(200), distinctUntilChanged(), startWith('')),
    this.userService.userList,
    this.projects$,
  ]).pipe(
    switchMap(([query, users, projects]) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return of(toSearchView([]));
      }
      return this.dataService.quickSearch(trimmed).pipe(
        catchError(() => of({ issues: [], hits: [] } as SearchResponse)),
        map((response) =>
          toSearchView(
            buildSearchItems({
              query: trimmed,
              issues: response.issues || [],
              hits: response.hits || [],
              users,
              projects,
            }),
          ),
        ),
      );
    }),
    tap((view) => {
      this.groups = view.groups;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.shortcuts.subscribe('Space', () => this.toggleOverlay(), {
      meta: true,
      skipInput: false,
    });
    this.shortcuts.subscribe('Slash', () => this.showOverlay(), {
      meta: false,
      skipInput: true,
    });
  }

  get isOverlayOpen(): boolean {
    return this.overlayOpen.getValue();
  }

  showOverlay(): void {
    this.overlayOpen.next(true);
    this.activeIndex.next(0);
  }

  hideOverlay(): void {
    this.overlayOpen.next(false);
  }

  toggleOverlay(): void {
    if (this.isOverlayOpen) {
      this.hideOverlay();
      return;
    }
    this.showOverlay();
  }

  setQuery(value: string): void {
    this.query.next(value);
    this.activeIndex.next(0);
  }

  moveActive(delta: number): void {
    this.activeIndex.next(
      moveActiveIndex(
        this.activeIndex.getValue(),
        delta,
        flattenGroups(this.groups).length,
      ),
    );
  }

  setActiveIndex(index: number): void {
    this.activeIndex.next(index);
  }

  openActive(): void {
    const item = flattenGroups(this.groups)[this.activeIndex.getValue()];
    if (item) {
      this.openItem(item);
    }
  }

  openItem(item: SearchItem): void {
    if (item.kind === 'history' && item.historyQuery) {
      this.setQuery(item.historyQuery);
      return;
    }
    if (item.kind === 'issue' && item.issue) {
      this.sidebarService.setCurrentTask(item.issue);
      this.hideOverlay();
      return;
    }
    if (item.kind === 'user') {
      const username = item.user?.username;
      if (username) {
        void this.router.navigate([{ outlets: { section: ['user', username] } }]);
      }
      this.hideOverlay();
      return;
    }
    if (item.kind === 'project' && item.project?.key) {
      void this.router.navigate(['/project', item.project.key]);
      this.hideOverlay();
    }
  }
}
