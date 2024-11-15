import { inject, Injectable } from '@angular/core';
import { ISelectItem, SelectModelBase } from '@renwu/components';
import { firstValueFrom, map } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { HolidayCalendar } from '../settings/dictionary.model';

@Injectable()
export class SelectModelHolidays extends SelectModelBase<HolidayCalendar> {
  private dataService = inject(RwDataService);

  dictionaryName = '';
  override dataHandler = (): Promise<ISelectItem<HolidayCalendar>[]> => {
    return firstValueFrom(
      this.dataService
        .getHolidayCalendarList()
        .pipe(map((l) => l.map((i) => this.convertDataToItemHandler(i)))),
    );
  };
  override convertDataToItemHandler = (
    data: HolidayCalendar,
  ): ISelectItem<HolidayCalendar> => {
    return { id: data.id, label: data.title, item: data };
  };
  override convertItemToDataHandler = (
    value: ISelectItem<HolidayCalendar>,
  ): HolidayCalendar => {
    return value?.item;
  };
}
