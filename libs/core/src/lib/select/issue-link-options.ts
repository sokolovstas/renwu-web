import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { escape } from '@renwu/utils';
import { firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';

const MIN_QUERY_LENGTH = 1;

/**
 * rw-select model: loads issues from `GET /issue/options?format=options&page=0&q=…`
 * (same endpoint as issue mentions / dictionary picker).
 */
export class SelectModelIssueLink
  extends SelectModelBase<Issue>
  implements ISelectModel<Issue>
{
  private readonly dataService = inject(RwDataService);

  constructor() {
    super();
    this.dataHandler = async (): Promise<ISelectItem<Issue>[]> => {
      const q = (this.searchString ?? '').trim();
      if (q.length < MIN_QUERY_LENGTH) {
        this.haveNext.next(false);
        return [];
      }
      this.loading.next(true);
      try {
        return await firstValueFrom(
          this.dataService
            .getDictionaryOptions<Issue>('issue/options', null, { q }, 0)
            .pipe(
              tap((r) => this.haveNext.next(!!r.next)),
              map((l) =>
                (l.results ?? []).map((i) => this.convertDataToItemHandler(i)),
              ),
            ),
        );
      } finally {
        this.loading.next(false);
      }
    };
    this.convertDataToItemHandler = (data: Issue): ISelectItem<Issue> => ({
      id: String(data.id ?? data.key ?? ''),
      label: this.formatOptionLabel(data),
      item: data,
    });
    this.convertItemToDataHandler = (value: ISelectItem<Issue>): Issue =>
      value?.item;
  }

  private formatOptionLabel(data: Issue): string {
    const key = escape(String(data.key ?? ''));
    const title = escape(String(data.title ?? ''));
    if (key && title) {
      return `${key} — ${title}`;
    }
    return key || title;
  }
}
