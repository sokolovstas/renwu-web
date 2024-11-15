import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RenwuPageComponent,
  RenwuPageWithSidebarComponent,
  RenwuSidebarService,
} from '@renwu/app-ui';
import { RwPagerComponent } from '@renwu/components';
import {
  Issue,
  IssueTableService,
  RwDataService,
  RwIssueTableComponent,
  RwQueryBuilderService,
  RwSearchService,
} from '@renwu/core';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';

@Component({
  selector: 'renwu-dashboard-main',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RenwuPageComponent,
    RenwuPageWithSidebarComponent,
    RwIssueTableComponent,
    RwPagerComponent,
    AsyncPipe,
    TranslocoPipe,
  ],
  providers: [RwQueryBuilderService, RwSearchService, IssueTableService],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  rows = 5;
  searchService = inject(RwSearchService);
  issueTableService = inject(IssueTableService);
  dataService = inject(RwDataService);
  sidebarService = inject(RenwuSidebarService);
  router = inject(Router);

  issuesPage = new BehaviorSubject<number>(0);
  issues = this.searchService
    .search('assignee = $me completed = false sort = -date_start_calc', '')
    .pipe(
      map((r) => r.issues),
      this.issueTableService.getRefreshedList(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  issuesDisplay = combineLatest([this.issuesPage, this.issues]).pipe(
    map(([p, l]) => {
      return l.slice(p * this.rows, (p + 1) * this.rows);
    }),
  );

  recentIssuesPage = new BehaviorSubject<number>(0);
  recentIssues = this.dataService
    .getUserTasks('recent')
    .pipe(
      this.issueTableService.getRefreshedList(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  recentIssuesDisplay = combineLatest([
    this.recentIssuesPage,
    this.recentIssues,
  ]).pipe(
    map(([p, l]) => {
      return l.slice(p * this.rows, (p + 1) * this.rows);
    }),
  );

  watchedPage = new BehaviorSubject<number>(0);
  watched = this.dataService
    .getUserTasks('watcher')
    .pipe(
      this.issueTableService.getRefreshedList(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  watchedDisplay = combineLatest([this.watchedPage, this.watched]).pipe(
    map(([p, l]) => {
      return l.slice(p * this.rows, (p + 1) * this.rows);
    }),
  );

  ngAfterViewInit(): void {
    this.sidebarService.scrollToMain();
  }

  issueClick(issue: Issue) {
    this.sidebarService.currentTask.next(issue);
  }
}
