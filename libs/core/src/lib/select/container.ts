import { inject, Injectable } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map } from 'rxjs';
import { Container } from '../container/container.model';
import { RwDataService } from '../data/data.service';

@Injectable()
export class SelectModelContainer
  extends SelectModelBase<Container>
  implements ISelectModel<Container>
{
  private dataService = inject(RwDataService);

  dictionaryName = '';
  override dataHandler = (): Promise<ISelectItem<Container>[]> => {
    return firstValueFrom(
      this.dataService
        .getDictionaryOptions<Container>('container', undefined, {
          archived: false,
        })
        .pipe(
          map((l) => l.results.map((i) => this.convertDataToItemHandler(i))),
        ),
    );
  };
  override convertDataToItemHandler = (
    data: Container,
  ): ISelectItem<Container> => {
    return { id: data.id, label: data.title, item: data };
  };
  override convertItemToDataHandler = (
    value: ISelectItem<Container>,
  ): Container => {
    return value?.item;
  };
}
