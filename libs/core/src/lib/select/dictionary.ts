import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map, tap } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { DictionariesDestinations } from '../settings/dictionary.model';

export interface CommonDictionary {
  id: string;
  title: string;
  label: string;
}
export class SelectModelDictionary
  extends SelectModelBase<CommonDictionary>
  implements ISelectModel<CommonDictionary>
{
  private dataService = inject(RwDataService);
  private dictionaryName: DictionariesDestinations;

  constructor(dictionaryName: DictionariesDestinations) {
    super();
    this.dictionaryName = dictionaryName;
  }

  override dataHandler = (): Promise<ISelectItem<CommonDictionary>[]> => {
    return firstValueFrom(
      this.dataService
        .getDictionaryOptions<CommonDictionary>(this.dictionaryName)
        .pipe(
          tap((r) => this.haveNext.next(!!r.next)),
          map((l) =>
            l.results
              .filter(
                (v) =>
                  v.label
                    ?.toLowerCase()
                    .includes(this.searchString.toLowerCase()) ||
                  v.title
                    ?.toLowerCase()
                    .includes(this.searchString.toLowerCase()),
              )
              .map((i) => this.convertDataToItemHandler(i)),
          ),
        ),
    );
  };
  override convertDataToItemHandler = (
    data: CommonDictionary,
  ): ISelectItem<CommonDictionary> => {
    return { id: data.id, label: data.title || data.label, item: data };
  };
  override convertItemToDataHandler = (
    value: ISelectItem<CommonDictionary>,
  ): CommonDictionary => {
    return value?.item;
  };
}
