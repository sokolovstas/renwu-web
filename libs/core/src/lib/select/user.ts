import { inject } from '@angular/core';
import { ISelectItem, SelectModelBase } from '@renwu/components';
import { Subject, lastValueFrom, shareReplay } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { User, UserStatic } from '../user/user.model';

export class SelectModelUser extends SelectModelBase<User> {
  private dataService: RwDataService = inject(RwDataService);
  private users = new Subject<User[]>();
  private cached = this.users.pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(many?: boolean, allowNull?: boolean, limit?: number) {
    super();
    this.many = many;
    this.allowNull = allowNull;
    this.limit = limit;
  }

  filterFunction: (user: User) => boolean = () => true;

  override show(): void {
    this.users.next(null);
    this.dataService.getUsers({}).subscribe(this.users);
    super.show();
  }

  override dataHandler = async (): Promise<ISelectItem<User>[]> => {
    const list = (await lastValueFrom(this.cached))
      .filter((u) => this.filterFunction(u))
      .filter((u) => UserStatic.getSearchString(u).includes(this.searchString))
      .map((i) => this.convertDataToItemHandler(i));
    return list;
  };

  override convertDataToItemHandler = (data: User): ISelectItem<User> => {
    return { id: data.id, label: this.getLabel(data), item: data };
  };
  override convertItemToDataHandler = (value: ISelectItem<User>): User => {
    return value?.item;
  };

  getLabel(source: User) {
    let ret = '';
    ret += '<div>';
    if (source.type === 'external') {
      ret += '<i class="icon-team"></i>&nbsp;';
    }
    ret += UserStatic.getStringValue(source);

    ret += '</div>';
    return ret;
  }
}
