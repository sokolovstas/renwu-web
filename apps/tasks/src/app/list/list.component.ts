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
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuPageComponent, RenwuSidebarService } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwModalService,
} from '@renwu/components';

import {
  Issue,
  IssueTableService,
  IssuesStatusBarComponent,
  ListOptions,
  QueryBuilderComponent,
  RwDataService,
  RwIssueTableComponent,
  RwQueryBuilderService,
  RwSearchService,
  RwWebsocketService,
  SavedSearchQuery,
} from '@renwu/core';
import { distinctUntilChanged, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { SaveFilterComponent } from '../save-filter/save-filter.component';

@Component({
  selector: 'renwu-tasks-list',
  standalone: true,
  imports: [
    IssuesStatusBarComponent,
    AsyncPipe,
    RenwuPageComponent,
    RwIssueTableComponent,
    QueryBuilderComponent,
    RwButtonComponent,
    TranslocoPipe,
  ],
  providers: [IssueTableService],
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
  modalService = inject(RwModalService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  listOptions = toSignal(this.searchService.listOptions);
  query = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      distinctUntilChanged(),
      switchMap((id) =>
        id ? this.dataService.getSearchQuery(id) : of(null),
      ),
    ),
  );

  queryString = computed(() => this.listOptions()?.queryString || '');
  isDirty = computed(() => {
    const saved = this.query();
    const current = this.queryString();
    if (!saved) {
      return !!current;
    }
    return (saved.query_string || '') !== current;
  });

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

  setListOptionsFromQuery = effect(() =>
    this.searchService.setListOptions(new ListOptions(this.query())),
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

  saveFilter(): void {
    const current = this.query();
    const modal = this.modalService.add(SaveFilterComponent, {
      filter: current,
      queryString: this.queryString(),
    });
    modal.saved
      .pipe(
        switchMap((filter: SavedSearchQuery) =>
          current?.id
            ? this.dataService.saveSearchQuery(current.id, filter)
            : this.dataService.addSearchQuery(filter),
        ),
        tap(() => {
          this.searchService.updateSaved.next();
          this.modalService.close();
        }),
      )
      .subscribe((saved) => {
        if (!current?.id && saved.id) {
          void this.router.navigate(['../', saved.id], {
            relativeTo: this.route,
          });
        }
      });
    modal.deleted
      .pipe(
        switchMap((id) => this.dataService.deleteSearchQuery(id)),
        tap(() => {
          this.searchService.updateSaved.next();
          this.modalService.close();
        }),
      )
      .subscribe(() => {
        void this.router.navigate(['..'], { relativeTo: this.route });
      });
  }
}
