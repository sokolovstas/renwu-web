import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { escape } from '@renwu/utils';
import { firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';

/**
 * rw-select model for issue pickers (`Issue`, `IssueLink`).
 * `GET /issue/options` — empty search shows recent issues first.
 */
export class SelectModelIssue
  extends SelectModelBase<Issue>
  implements ISelectModel<Issue>
{
  private readonly dataService = inject(RwDataService);

  constructor() {
    super();
    this.dataHandler = async (): Promise<ISelectItem<Issue>[]> => {
      const q = (this.searchString ?? '').trim();
      this.loading.next(true);
      try {
        return await firstValueFrom(
          this.dataService
            .getDictionaryOptions<Issue>('issue/options', '', { q }, 0)
            .pipe(
              tap((r) => this.haveNext.next(!!r.next)),
              map((r) =>
                (r.results ?? []).map((i) => this.convertDataToItemHandler(i)),
              ),
            ),
        );
      } finally {
        this.loading.next(false);
      }
    };
    this.convertDataToItemHandler = (data: Issue): ISelectItem<Issue> => ({
      id: String(data.id ?? data.key ?? ''),
      label: SelectModelIssue.formatLabel(data),
      item: data,
    });
    this.convertItemToDataHandler = (value: ISelectItem<Issue>): Issue =>
      value?.item;
  }

  static formatLabel(data: Issue, escapeHtml = true): string {
    const key = escapeHtml
      ? escape(String(data.key ?? ''))
      : String(data.key ?? '');
    const title = escapeHtml
      ? escape(String(data.title ?? ''))
      : String(data.title ?? '');
    if (key && title) {
      return `${key} — ${title}`;
    }
    return key || title;
  }
}

/** @deprecated Use {@link SelectModelIssue}. */
export const SelectModelIssueLink = SelectModelIssue;
