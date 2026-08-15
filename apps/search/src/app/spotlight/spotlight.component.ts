import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE, TranslocoPipe } from '@jsverse/transloco';
import { RenwuSearchOverlayService, RenwuSidebarService } from '@renwu/app-ui';
import { RwIconComponent } from '@renwu/components';
import {
  AvatarComponent,
  Container,
  IssueTypeComponent,
  RwDataService,
  RwUserService,
  SearchHistory,
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
  GROUP_PEOPLE,
  GROUP_PROJECTS,
  GROUP_RECENT,
  SpotlightGroup,
  SpotlightItem,
  buildSpotlightItems,
  flattenGroups,
  groupSpotlightItems,
  moveActiveIndex,
} from './spotlight-results';

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};
  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => import(`../../i18n/${lang}.json`);
  });
  return translocoInlineLoader;
};

@Component({
  selector: 'renwu-search-spotlight',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    RwIconComponent,
    AvatarComponent,
    IssueTypeComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'search',
        loader: createInlineLoader(['en', 'ru', 'zh']),
      },
    },
  ],
  templateUrl: './spotlight.component.html',
  styleUrl: './spotlight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSpotlightComponent implements OnInit {
  @Input() variant: 'overlay' | 'page' = 'overlay';

  @ViewChild('queryInput')
  queryInput?: ElementRef<HTMLInputElement>;

  private readonly dataService = inject(RwDataService);
  private readonly userService = inject(RwUserService);
  private readonly router = inject(Router);
  private readonly sidebarService = inject(RenwuSidebarService);
  readonly overlay = inject(RenwuSearchOverlayService);
  private readonly destroy = inject(DestroyRef);

  readonly query = new BehaviorSubject('');
  readonly activeIndex = new BehaviorSubject(0);
  private groups: SpotlightGroup[] = [];

  private readonly projects$: Observable<Container[]> = this.dataService
    .getContainers()
    .pipe(
      catchError(() => of([] as Container[])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  readonly view$ = combineLatest([
    this.query.pipe(debounceTime(200), distinctUntilChanged(), startWith('')),
    this.userService.userList,
    this.projects$,
  ]).pipe(
    switchMap(([query, users, projects]) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return this.dataService.searchHistory().pipe(
          catchError(() => of([] as SearchHistory[])),
          map((history) =>
            this.toView(
              buildSpotlightItems({
                query: '',
                issues: [],
                hits: [],
                users: [],
                projects: [],
                history,
              }),
            ),
          ),
        );
      }
      return this.dataService.quickSearch(trimmed).pipe(
        catchError(() => of({ issues: [], hits: [] } as SearchResponse)),
        map((response) =>
          this.toView(
            buildSpotlightItems({
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

  ngOnInit(): void {
    this.overlay.open$
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((open) => {
        if (open || this.variant === 'page') {
          this.activeIndex.next(0);
          setTimeout(() => this.queryInput?.nativeElement.focus());
        }
        if (!open && this.variant === 'overlay') {
          this.query.next('');
        }
      });
    if (this.variant === 'page') {
      setTimeout(() => this.queryInput?.nativeElement.focus());
    }
  }

  onQuery(value: string): void {
    this.query.next(value);
    this.activeIndex.next(0);
  }

  onQueryInput(event: Event): void {
    this.onQuery((event.target as HTMLInputElement).value);
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const items = flattenGroups(this.groups);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.next(
        moveActiveIndex(this.activeIndex.getValue(), 1, items.length),
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.next(
        moveActiveIndex(this.activeIndex.getValue(), -1, items.length),
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.activeIndex.getValue()];
      if (item) {
        this.openItem(item);
      }
      return;
    }
    if (event.key === 'Escape' && this.variant === 'overlay') {
      event.preventDefault();
      this.overlay.hide();
    }
  }

  openItem(item: SpotlightItem): void {
    if (item.kind === 'history' && item.historyQuery) {
      this.query.next(item.historyQuery);
      this.activeIndex.next(0);
      return;
    }
    if (item.kind === 'issue' && item.issue) {
      this.sidebarService.setCurrentTask(item.issue);
      this.overlay.hide();
      return;
    }
    if (item.kind === 'user') {
      const username = item.user?.username;
      if (username) {
        void this.router.navigate([{ outlets: { section: ['user', username] } }]);
      }
      this.overlay.hide();
      return;
    }
    if (item.kind === 'project' && item.project?.key) {
      void this.router.navigate(['/project', item.project.key]);
      this.overlay.hide();
    }
  }

  closeOverlay(): void {
    if (this.variant === 'overlay') {
      this.overlay.hide();
    }
  }

  groupTranslateKey(group: SpotlightGroup): string {
    if (
      group.id === GROUP_PEOPLE ||
      group.id === GROUP_PROJECTS ||
      group.id === GROUP_RECENT
    ) {
      return `search.${group.id}`;
    }
    return '';
  }

  private toView(items: SpotlightItem[]): {
    groups: SpotlightGroup[];
    items: SpotlightItem[];
  } {
    const groups = groupSpotlightItems(items);
    return { groups, items: flattenGroups(groups) };
  }
}
