import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { Status } from '../settings/dictionary.model';

export class SelectModelTransition
  extends SelectModelBase<Status>
  implements ISelectModel<Status>
{
  public id: string;
  dataService = inject(RwDataService);
  override dataHandler = (): Promise<ISelectItem<Status>[]> => {
    return firstValueFrom(
      this.dataService
        .getIssueTransitions(this.id)
        .pipe(map((l) => l.map((i) => this.convertDataToItemHandler(i.to)))),
    );
  };
  override convertDataToItemHandler = (data: Status): ISelectItem<Status> => {
    return { id: data.id, label: data.label || data.label, item: data };
  };
  override convertItemToDataHandler = (value: ISelectItem<Status>): Status => {
    return value?.item;
  };
}
