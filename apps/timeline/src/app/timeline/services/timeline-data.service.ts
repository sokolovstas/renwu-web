import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Issue,
  IssueGroup,
  ListOptionsFilters,
  Milestone,
  TimelineParsedLink,
  RwDataService,
  TimelineService as CoreTimelineService,
  UserWorkload,
  UserWorkloadIssues,
} from '@renwu/core';

type IssueTreeFilters = ListOptionsFilters & { group_by?: string };

@Injectable()
export class TimelineDataService {
  private dataService = inject(RwDataService);
  private coreTimelineService = inject(CoreTimelineService);

  loadMilestones(
    containerId: string,
    archived = false,
  ): Observable<Milestone[]> {
    return this.dataService.getMilestones(containerId, archived);
  }

  loadIssueTree(
    containerId: string,
    grouping: string,
    filters: IssueTreeFilters,
  ): Observable<IssueGroup[]> {
    return this.dataService.getContainerIssueTreeGrouped(
      containerId,
      grouping.toLowerCase(),
      filters,
    );
  }

  loadUserWorkload(
    userId: string,
    filters: ListOptionsFilters,
  ): Observable<UserWorkload> {
    return this.dataService.getUserWorkload(userId, filters);
  }

  loadUserWorkloadIssues(
    userId: string,
    filters: ListOptionsFilters,
  ): Observable<UserWorkloadIssues> {
    return this.dataService.getUserWorkloadIssues(userId, filters);
  }

  saveIssue(
    issueId: string,
    patch: Partial<Issue>,
  ): Observable<Issue> {
    return this.dataService.saveIssue(issueId, patch as Issue);
  }

  /**
   * Shared parsing of issue-links into link references.
   * Remote UI can use it to avoid duplicating link traversal logic.
   */
  parseLinksFromIssues(
    rows: unknown[],
    issuesMap: Record<string, Issue>,
  ): TimelineParsedLink[] {
    // The UI tree uses the same shape as `Issue` for `links` and `childs`.
    type RowsParam = Parameters<CoreTimelineService['parseLinks']>[0];
    const rowsTyped = rows as unknown as RowsParam;
    return this.coreTimelineService.parseLinks(rowsTyped, issuesMap);
  }
}

