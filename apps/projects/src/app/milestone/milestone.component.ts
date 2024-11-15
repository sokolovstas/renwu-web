import { AsyncPipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent, RenwuSidebarService } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwDatePipe,
  RwFormatArrayStringPipe,
  RwIconComponent,
  RwModalService,
} from '@renwu/components';
import {
  Issue,
  IssueTableService,
  IssuesStatusBarComponent,
  ListOptions,
  Milestone,
  RwDataService,
  RwIssueService,
  RwIssueTableComponent,
  RwQueryBuilderService,
  RwSearchService,
  RwWebsocketService,
} from '@renwu/core';
import {
  distinctUntilChanged,
  map,
  merge,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { AddMilestoneComponent } from '../add-milestone/add-milestone.component';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-milestone',
  standalone: true,
  imports: [
    AsyncPipe,
    RwIconComponent,
    RenwuPageComponent,
    RwDatePipe,
    JsonPipe,
    RwFormatArrayStringPipe,
    RwButtonComponent,
    RwIssueTableComponent,
    IssuesStatusBarComponent,
    TranslocoPipe,
  ],
  providers: [RwQueryBuilderService, RwSearchService, IssueTableService],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestoneComponent {
  queryBuilderService = inject(RwQueryBuilderService);
  sidebarService = inject(RenwuSidebarService);
  issueTableService = inject(IssueTableService);
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);
  searchService = inject(RwSearchService);
  projectService = inject(ProjectService);
  modalService = inject(RwModalService);
  router = inject(Router);
  websocketService = inject(RwWebsocketService);
  milestone = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => p.get('id')),
      distinctUntilChanged(),
      switchMap((id) => this.dataService.getMilestone(id)),
      distinctUntilChanged((p, c) => p.id === c.id),
    ),
  );
  currentProject = toSignal(this.projectService.currentProject);

  setListOptionsFromQuery = effect(
    () => {
      this.searchService.updateQuery(
        `milestones="${this.milestone().title}" AND project="${
          this.milestone().container.key
        }"`,
      );
    },
    { allowSignalWrites: true },
  );

  tasks = this.searchService.listOptions.pipe(
    switchMap((options) =>
      this.searchService.search(options.queryString, '', options.hash),
    ),
    map((r) => r.issues),
    this.issueTableService.getRefreshedList(
      merge(this.searchService.listOptions),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  listOptions = toSignal(this.searchService.listOptions);

  edit(milestone: Milestone) {
    const addModal = this.modalService.add(AddMilestoneComponent, {
      milestone,
    });
    addModal.added
      .pipe(
        switchMap((data) => this.projectService.saveMilestone(data)),
        tap(() => this.modalService.close()),
      )
      .subscribe();
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
  async resetFilter() {
    this.searchService.updateQuery(`milestones="${this.milestone().title}"`);
  }
  async addTaskToMilestone() {
    await this.router.navigate([{ outlets: { section: ['task', 'new'] } }]);
    setTimeout(async () => {
      this.issueService.updateFromTemplate({
        container: this.currentProject(),
        milestones: [this.milestone()],
      });
    });
  }
}
