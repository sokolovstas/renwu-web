import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// export type SelectData = unknown | string | number;
export type SelectModels<T> = Map<string, ISelectModel<T>>;
export const SELECT_MODELS = new InjectionToken<SelectModels<unknown>>(
  'rw-select-models',
);
export interface ISelectModel<T> {
  list: BehaviorSubject<ISelectItem<T>[]>;
  selected: BehaviorSubject<ISelectItem<T>[]>;
  loading: BehaviorSubject<boolean>;
  haveNext: BehaviorSubject<boolean>;
  emptyItem: BehaviorSubject<ISelectItem<T>>;
  currentPage: number;
  many: boolean;
  allowNull: boolean;
  // prompt: string;
  // TODO
  createNewOption: boolean;
  // removeSelected = true;
  // filterFunction: any;
  limit: number;
  // hideActiveValue = false;
  // hideMoreThan = 1000;
  // reloadOnOpen: boolean;
  // useValidationValue = true;

  // Search for item
  search(query: string): void;
  // Select index
  select(index: number): void;
  // Unselect item
  unselect(index: number): void;
  // Set incoming data
  setData(data: T | T[]): void;
  // Set selected values
  getData(): T | T[];
  // Check if item is selected
  isSelected(item: ISelectItem<T>): boolean;
  // Load page with search params
  loadPage(page: number): Promise<ISelectItem<T>[]>;
  // Call on select show
  show(): void;
}
export interface ISelectItem<T> {
  id: number | string;
  label: string;
  cantRemove?: boolean;
  item?: T;
  [x: string]: unknown;
}

export class SelectModelBase<T> implements ISelectModel<T> {
  protectedlist = new BehaviorSubject<ISelectItem<T>[]>([]);
  selected = new BehaviorSubject<ISelectItem<T>[]>([]);
  loading = new BehaviorSubject<boolean>(false);
  haveNext = new BehaviorSubject<boolean>(false);
  emptyItem = new BehaviorSubject<ISelectItem<T>>(null);

  limit = 0;
  currentPage = 0;

  many = false;
  loadSelected = false;
  staticData: ISelectItem<T>[];
  allowNull = false;
  createNewOption = false;
  dataHandler: (page: number, value?: T | T[]) => Promise<ISelectItem<T>[]>;
  convertDataToItemHandler: (data: T) => ISelectItem<T>;
  convertItemToDataHandler: (value: ISelectItem<T>) => T;

  created: ISelectItem<T>[] = [];

  searchString = '';

  constructor() {
    this.selected.next([]);
  }
  list = new BehaviorSubject<ISelectItem<T>[]>([]);

  search(query: string): void {
    this.searchString = query;
    this.loadPage(0);
  }
  select(index: number): void {
    const list = this.list.getValue();

    if (this.createNewOption && this.searchString) {
      list.push({
        id: this.searchString,
        label: this.searchString,
      });
      this.created.push({
        id: this.searchString,
        label: this.searchString,
      });
    }

    if (this.many) {
      const existIndex = this.selected
        .getValue()
        .findIndex((i) => this.compareItems(i, list[index]));
      if (existIndex > -1) {
        this.selected.next([
          ...this.selected.getValue().filter((item, i) => i !== existIndex),
        ]);
      } else {
        let values = [...this.selected.getValue(), list[index]];
        if (this.limit) {
          values = values.slice(-this.limit);
        }
        this.selected.next(values);
      }
    } else {
      this.selected.next([list[index]]);
    }
  }
  unselect(index: number): void {
    this.selected.next([
      ...this.selected.getValue().filter((item, i) => i !== index),
    ]);
  }
  getData(): T | T[] {
    return this.convertItemToData();
  }
  async setData(data: T | T[]): Promise<void> {
    if (
      data === undefined ||
      data === null ||
      (this.many && (data as Array<T>).length === 0)
    ) {
      this.selected.next([]);
      return;
    }
    if (this.loadSelected) {
      let items = await this.loadData(0, data);
      if (this.many) {
        items = items.filter(
          (i) =>
            (data as Array<T>).findIndex((d) =>
              this.compareDataWithItem(d, i),
            ) > -1,
        );
        this.selected.next([...items]);
      } else {
        this.selected.next([
          items.find((i) => this.compareDataWithItem(data as T, i)),
        ]);
      }
    } else {
      if (this.many) {
        this.selected.next((data as T[]).map((i) => this.convertDataToItem(i)));
      } else {
        this.selected.next([this.convertDataToItem(data as T)]);
      }
    }
  }
  isSelected(item: ISelectItem<T>): boolean {
    return (
      this.selected.getValue().findIndex((i) => this.compareItems(i, item)) > -1
    );
  }
  async loadPage(page: number): Promise<ISelectItem<T>[]> {
    const data = await this.loadData(page);
    const prepend: ISelectItem<T>[] = [];
    if (this.createNewOption && this.searchString) {
      prepend.push({ id: this.searchString, label: this.searchString });
    }
    this.list.next([...prepend, ...this.created, ...data]);

    this.loading.next(false);

    return data;
  }
  show(): void {
    this.search('');
    // this.loadPage(this.currentPage).subscribe();
  }

  protected compareItems(
    itema: ISelectItem<T>,
    itemb: ISelectItem<T>,
  ): boolean {
    if (!itema && itemb) {
      return false;
    }
    if (itema && !itemb) {
      return false;
    }
    return itema.id === itemb.id;
  }

  protected convertDataToItem(data: T): ISelectItem<T> {
    if (this.convertDataToItemHandler) {
      return this.convertDataToItemHandler(data);
    }
    return { id: data.toString(), label: data.toString() };
  }

  protected convertItemToData(): T | T[] {
    if (this.many) {
      if (this.convertItemToDataHandler) {
        return this.selected.getValue().map(this.convertItemToDataHandler);
      }
      return this.selected.getValue().map((item) => item.id as T);
    } else {
      if (this.convertItemToDataHandler) {
        return this.convertItemToDataHandler(
          this.selected.getValue()[0] || undefined,
        );
      }
      return this.selected.getValue()[0]
        ? (this.selected.getValue()[0].id as T)
        : undefined;
    }
  }

  protected compareDataWithItem(data: T, item: ISelectItem<T>): boolean {
    return this.compareItems(this.convertDataToItem(data), item);
  }

  protected async loadData(
    page: number,
    value?: T | T[],
  ): Promise<ISelectItem<T>[]> {
    // If data is static just display list
    if (this.staticData) {
      this.haveNext.next(false);
      if (value && !this.many) {
        this.selected.next([
          this.staticData.find((d) => this.compareDataWithItem(value as T, d)),
        ]);
      }
      return this.staticData.filter((d) => {
        return (
          d.label.toLowerCase().indexOf(this.searchString.toLocaleLowerCase()) >
          -1
        );
      });
    }
    // On load data you have to return observable with data and set haveNext if needed
    if (this.dataHandler) {
      return this.dataHandler(page, value);
    }
    return [];
  }
}
