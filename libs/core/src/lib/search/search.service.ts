import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Md5 } from 'ts-md5';
import { RwDataService } from '../data/data.service';
import { SearchQuery, SearchResponse } from '../search/search.model';
import { OQLParseListener } from './oql/OQLParseListener';
import { ListOptions, SortFields } from './sort.model';

@Injectable()
export class RwSearchService {
  private dataService = inject(RwDataService);

  updateSaved = new BehaviorSubject<void>(null);

  savedQueries = this.updateSaved.pipe(
    mergeMap(() => this.dataService.getSearchQueries()),
  );

  search(
    query: string,
    text: string,
    hash?: string,
  ): Observable<SearchResponse> {
    if (this.isAdvanced(query) || hash) {
      return this.dataService.advancedSearch(
        this.generateSearchQuery(query, text, hash),
      );
    } else {
      return this.dataService.quickSearch(query);
    }
  }
  isAdvanced(query: string): boolean {
    const visitor = new OQLParseListener(query);

    return visitor.index.length >= 3 && visitor.errors.length === 0;
  }

  generateSearchQuery(query: string, text: string, hash?: string): SearchQuery {
    const searchQuery: SearchQuery = {};
    searchQuery.query = query;
    searchQuery.text = text;
    if (query === '' && hash) {
      searchQuery.query_hash = hash;
    }
    searchQuery.page_size = 99999;
    return searchQuery;
  }

  listOptions = new BehaviorSubject<ListOptions>(new ListOptions());

  private get _listOptions() {
    return this.listOptions.getValue();
  }

  setListOptions(value: ListOptions) {
    if (value) {
      const changed =
        (value.queryString || '') !== this._listOptions.queryString;
      const changedHash = value.hash !== this._listOptions.hash;
      if (changed && value.queryString !== '') {
        this._listOptions.queryString = value.queryString;
        this.onChange();
        return;
      }

      if (changedHash && value.hash !== '') {
        this._listOptions.hash = value.hash;
        this.dataService
          .getSearchQuery(this._listOptions.hash)
          .subscribe((query) => {
            this._listOptions.queryString = query.query_string;
            this.onChange();
          });
        return;
      }
    }
    this.onChange();
  }

  updateQuery(value: string) {
    this._listOptions.queryString = value || '';
    this.onChange();
  }

  updateListOptions(value: ListOptions) {
    if (value) {
      value = { ...this._listOptions, ...value };

      const query = new OQLParseListener(value.queryString);
      if (value.textFilter?.['key']) {
        query.switchValueInAtom('key', 2, `"${value.textFilter['key']}"`);
      } else {
        query.switchValueInAtom('key', 2, undefined);
      }
      if (value.textFilter?.['title']) {
        query.switchValueInAtom('title', 2, `"${value.textFilter['title']}"`);
      } else {
        query.switchValueInAtom('title', 2, undefined);
      }
      if (value.sort && value.sort.field) {
        const direction = value.sort.direction === 'down' ? '-' : '';
        query.switchValueInAtom('sort', 2, `${direction}${value.sort.field}`);
      } else {
        query.switchValueInAtom('sort', 2, undefined);
      }

      this._listOptions.queryString = query.query || '';
    }

    this.onChange();
  }

  convertQueryToListOptions(): void {
    const query = new OQLParseListener(this._listOptions.queryString);
    const sort = query.getValueInAtom('sort', 2);
    if (sort) {
      this._listOptions.sort = {
        direction: sort[0] === '-' ? 'down' : 'up',
        field: (sort[0] === '-' ? sort.slice(1) : sort) as SortFields,
      };
    } else {
      this._listOptions.sort = {
        direction: undefined,
        field: undefined,
      };
    }

    this._listOptions.textFilter['title'] = query.getValueInAtom('title', 2);
    this._listOptions.textFilter['key'] = query.getValueInAtom('key', 2);
  }

  onChange(): void {
    if (this._listOptions.queryString) {
      this._listOptions.hash = Md5.hashStr(
        this._listOptions.queryString.trim() || '',
      );
      this.convertQueryToListOptions();
      this.listOptions.next({ ...this._listOptions });
    }
  }
  filterByBar(
    name: string,
    value: { id: string; title?: string; label?: string },
  ) {
    const stringValue = value.label || value.title;

    this._listOptions.queryString = new OQLParseListener(
      this._listOptions.queryString,
    ).switchValueInAtom(name, 2, stringValue).query;

    this.onChange();
  }
}
