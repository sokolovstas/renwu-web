import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { RwIssueOptionsService } from '../issue/issue-options.service';
import { Issue } from '../issue/issue.model';

/**
 * rw-select model for issue pickers (`Issue`, `IssueLink`).
 * Uses shared {@link RwIssueOptionsService} — empty search shows recent issues.
 */
export class SelectModelIssueLink
  extends SelectModelBase<Issue>
  implements ISelectModel<Issue>
{
  private readonly issueOptions = inject(RwIssueOptionsService);

  constructor() {
    super();
    this.dataHandler = async (): Promise<ISelectItem<Issue>[]> => {
      this.loading.next(true);
      try {
        return await firstValueFrom(
          this.issueOptions.search(this.searchString).pipe(
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
      label: this.issueOptions.formatLabel(data),
      item: data,
    });
    this.convertItemToDataHandler = (value: ISelectItem<Issue>): Issue =>
      value?.item;
  }
}
