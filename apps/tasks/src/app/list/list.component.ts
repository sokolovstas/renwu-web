import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent, RenwuSidebarService } from '@renwu/app-ui';
import { RwButtonComponent } from '@renwu/components';
import {
  Issue,
  IssueAssigneesComponent,
  IssuePriorityComponent,
  IssueStatusComponent,
  IssueTableService,
  IssueTypeComponent,
  IssuesStatusBarComponent,
  ListOptions,
  QueryBuilderComponent,
  RwDataService,
  RwIssueTableComponent,
  RwQueryBuilderService,
  RwSearchService,
  RwWebsocketService,
} from '@renwu/core';
import { distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-tasks-list',
  standalone: true,
  imports: [
    RwButtonComponent,
    IssuesStatusBarComponent,
    AsyncPipe,
    RenwuPageComponent,
    IssueStatusComponent,
    IssueAssigneesComponent,
    IssuePriorityComponent,
    IssueTypeComponent,
    RouterLink,
    RwIssueTableComponent,
    QueryBuilderComponent,
    TranslocoPipe,
  ],
  providers: [RwQueryBuilderService, IssueTableService, RwSearchService],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnDestroy {
  sidebarService = inject(RenwuSidebarService);
  dataService = inject(RwDataService);
  searchService = inject(RwSearchService);
  queryBuilderService = inject(RwQueryBuilderService);
  websocketService = inject(RwWebsocketService);
  issueTableService = inject(IssueTableService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  listOptions = toSignal(this.searchService.listOptions);
  query = toSignal(
    this.route.paramMap.pipe(
      distinctUntilChanged(),
      switchMap((map) => this.dataService.getSearchQuery(map.get('id'))),
    ),
  );

  queryString = computed(() => this.listOptions().queryString);

  allTask = this.searchService.listOptions.pipe(
    switchMap((q: ListOptions) => {
      if (q.queryString || q.hash) {
        return this.searchService.search(q.queryString, '', q.hash);
      }
      return of({ issues: [] });
    }),
    map((r) => r.issues),
    this.issueTableService.getRefreshedList(this.searchService.listOptions),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  setListOptionsFromQuery = effect(
    () => this.searchService.setListOptions(new ListOptions(this.query())),
    { allowSignalWrites: true },
  );

  ngOnDestroy(): void {
    this.websocketService.clearId('issuelist');
  }

  issueClick(issue: Issue) {
    this.sidebarService.currentTask.next(issue);
  }

  filterByBar(value: { id: string; title?: string; label?: string }) {
    this.searchService.filterByBar(
      this.searchService.listOptions.getValue().group.field,
      value,
    );
  }
  updateListOptions(value: ListOptions) {
    this.searchService.updateListOptions(value);
  }
  updateQuery(value: string) {
    this.searchService.updateQuery(value);
  }
  async resetFilter() {
    this.searchService.setListOptions(new ListOptions(this.query()));
  }
}
