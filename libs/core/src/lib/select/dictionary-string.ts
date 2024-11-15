import { inject } from '@angular/core';
import { ISelectItem, ISelectModel, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map, tap } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { DictionariesDestinations } from '../settings/dictionary.model';

export class SelectModelStringDictionary
  extends SelectModelBase<string>
  implements ISelectModel<string>
{
  private dataService = inject(RwDataService);
  private dictionaryName: DictionariesDestinations;

  constructor(
    dictionaryName: DictionariesDestinations,
    many?: boolean,
    createNewOption?: boolean,
  ) {
    super();
    this.dictionaryName = dictionaryName;
    this.many = many;
    this.createNewOption = createNewOption;
  }

  override dataHandler = (): Promise<ISelectItem<string>[]> => {
    return firstValueFrom(
      this.dataService.getDictionaryOptions<string>(this.dictionaryName).pipe(
        tap((r) => this.haveNext.next(!!r.next)),
        map((l) => l.results.map((i) => this.convertDataToItemHandler(i))),
      ),
    );
  };
  override convertDataToItemHandler = (data: string): ISelectItem<string> => {
    return { id: data, label: data, item: data };
  };
  override convertItemToDataHandler = (value: ISelectItem<string>): string => {
    return value?.label;
  };
}
