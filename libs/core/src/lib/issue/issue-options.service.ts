import { Injectable, inject } from '@angular/core';
import { escape } from '@renwu/utils';
import { Observable, map } from 'rxjs';

import { OptionsResponse } from '../data/common.model';
import { RwDataService } from '../data/data.service';
import { Issue } from './issue.model';

export interface IssueOptionsSearchParams {
  container?: string;
  page?: number;
}

/**
 * Shared picker search for issues via `GET /issue/options`.
 * Empty query returns recent issues first (backend ListIssuesOptions).
 */
@Injectable({
  providedIn: 'root',
})
export class RwIssueOptionsService {
  private readonly dataService = inject(RwDataService);

  search(
    query = '',
    params: IssueOptionsSearchParams = {},
  ): Observable<OptionsResponse<Issue>> {
    const filters: Record<string, string> = {
      q: (query ?? '').trim(),
    };
    if (params.container) {
      filters['container'] = params.container;
    }
    return this.dataService.getDictionaryOptions<Issue>(
      'issue/options',
      '',
      filters,
      params.page ?? 0,
    );
  }

  searchIssues(
    query = '',
    params: IssueOptionsSearchParams = {},
  ): Observable<Issue[]> {
    return this.search(query, params).pipe(map((r) => r.results ?? []));
  }

  formatLabel(issue: Issue, escapeHtml = true): string {
    const key = escapeHtml
      ? escape(String(issue.key ?? ''))
      : String(issue.key ?? '');
    const title = escapeHtml
      ? escape(String(issue.title ?? ''))
      : String(issue.title ?? '');
    if (key && title) {
      return `${key} — ${title}`;
    }
    return key || title;
  }
}
