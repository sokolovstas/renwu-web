import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuSidebarService } from '@renwu/app-ui';
import { RwButtonComponent, RwPagerComponent } from '@renwu/components';
import {
  Issue,
  IssueTableService,
  IssuesStatusBarComponent,
  ListOptions,
  RwIssueTableComponent,
  RwQueryBuilderService,
  RwSearchService,
  RwUserService,
  User,
} from '@renwu/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { UserService } from '../../user.service';

@Component({
  selector: 'renwu-profile-view-tasks',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    RwIssueTableComponent,
    RwPagerComponent,
    RwButtonComponent,
    IssuesStatusBarComponent,
  ],
  providers: [RwQueryBuilderService, RwSearchService, IssueTableService],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewTasksComponent {
  private readonly profileUserService = inject(UserService);
  private readonly userService = inject(RwUserService);
  private readonly searchService = inject(RwSearchService);
  private readonly issueTableService = inject(IssueTableService);
  private readonly sidebarService = inject(RenwuSidebarService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly page = new BehaviorSubject(0);
  protected readonly pageSize = 10;

  /** Base OQL for the profile user; reset returns to this. */
  protected baseQuery = '';

  protected readonly listOptions = toSignal(this.searchService.listOptions, {
    initialValue: new ListOptions(),
  });

  protected readonly queryString = computed(
    () => this.listOptions()?.queryString || '',
  );

  protected readonly filterIsDirty = computed(
    () => Boolean(this.baseQuery) && this.queryString() !== this.baseQuery,
  );

  protected readonly issues = this.searchService.listOptions.pipe(
    switchMap((options: ListOptions) => {
      if (!options.queryString && !options.hash) {
        return of({ issues: [] as Issue[] });
      }
      this.page.next(0);
      return this.searchService.search(options.queryString, '', options.hash);
    }),
    map((r) => r.issues ?? []),
    this.issueTableService.getRefreshedList(this.searchService.listOptions),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly issuesDisplay = combineLatest([
    this.page,
    this.issues,
  ]).pipe(
    map(([p, list]) =>
      list.slice(p * this.pageSize, (p + 1) * this.pageSize),
    ),
  );

  constructor() {
    this.profileUserService.currentUser
      .pipe(
        filter((u): u is User => Boolean(u?.id || u?.username)),
        distinctUntilChanged((a, b) => a?.id === b?.id),
        tap((user) => {
          this.baseQuery = this.buildBaseQuery(user);
          this.searchService.updateQuery(this.baseQuery);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected issueClick(issue: Issue): void {
    this.sidebarService.currentTask.next(issue);
  }

  protected filterByBar(value: {
    id: string;
    title?: string;
    label?: string;
  }): void {
    this.searchService.filterByBar(
      this.searchService.listOptions.getValue().group.field,
      value,
    );
  }

  protected updateListOptions(value: ListOptions): void {
    this.searchService.updateListOptions(value);
  }

  protected resetFilter(): void {
    if (!this.baseQuery) return;
    this.searchService.updateQuery(this.baseQuery);
  }

  private buildBaseQuery(user: User): string {
    const username =
      this.userService.getUsername(user) || user.username || '';
    if (!username) return '';
    const isMe = Boolean(user.id && this.userService.getIsCurrent(user.id));
    const assignee = isMe ? '$me' : `"${username}"`;
    return `assignee = ${assignee} completed = false sort = -date_start_calc`;
  }
}
