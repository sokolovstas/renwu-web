import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map } from 'rxjs';
import { Milestone } from '../container/milestone.model';
import { RwDataService } from '../data/data.service';

export class SelectModelMilestones
  extends SelectModelBase<Milestone>
  implements ISelectModel<Milestone>
{
  private dataService = inject(RwDataService);
  override many = true;

  public containerId = '';

  dictionaryName = '';
  override dataHandler = (): Promise<ISelectItem<Milestone>[]> => {
    return firstValueFrom(
      this.dataService.getMilestones(this.containerId).pipe(
        map((list) =>
          list
            .filter((m) =>
              this.containerId ? m.container.id === this.containerId : true,
            )
            .sort((a, b) => {
              return b.sort - a.sort;
            })
            .map((i) => this.convertDataToItemHandler(i)),
        ),
      ),
    );
  };
  override convertDataToItemHandler = (
    data: Milestone,
  ): ISelectItem<Milestone> => {
    if (!this.containerId) {
      return {
        id: data.id,
        label: data.container
          ? `${data.title} (${data.container?.key})`
          : data.title,
        item: data,
      };
    }
    return { id: data.id, label: data.title, item: data };
  };
  override convertItemToDataHandler = (
    value: ISelectItem<Milestone>,
  ): Milestone => {
    return value?.item;
  };
}
