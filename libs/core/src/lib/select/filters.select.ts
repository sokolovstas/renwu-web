import { ISelectItem, SelectModelBase } from '@renwu/components';

import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RwDataService } from '../data/data.service';
export class SelectModelFilter extends SelectModelBase {
  constructor(private dataService: RwDataService) {
    super();
    // this.convertItemToDataHandler = value => {
    //   return value.item;
    // }
    // this.convertDataToItemHandler = data => {
    //   return { id: data.id, label: data.title, item: data };
    // }
  }
  protected loadData(page: number, value?: any): Observable<ISelectItem[]> {
    return forkJoin(
      this.dataService.getSearchQueries(),
      this.dataService.searchHistory(),
    ).pipe(
      map(([saved, history]) => {
        return [
          { id: null, label: '---', item: null },
          ...saved.map((item) => ({
            id: item.id,
            label: item.title,
            item: item,
          })),
          // ...history.map(item => ({ id: item.hash, label: item.query_string, item: item })),
        ];
      }),
    );
  }
}
