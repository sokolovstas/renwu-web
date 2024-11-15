import { SavedSearchQuery, SearchHistory } from './search.model';

export type SortDirections = 'up' | 'down';
export type SortFields =
  | 'key'
  | 'assignes'
  | 'reporter'
  | 'milestones'
  | 'milestones.sort'
  | 'affected_versions'
  | 'title'
  | 'completion'
  | 'skill'
  | 'date_created'
  | 'date_start'
  | 'date_start_calc'
  | 'date_status_changed'
  | 'date_last_update'
  | 'priority'
  | 'type'
  | 'resolution'
  | 'status'
  | '__timelog-date-created';
type ListTextFilters = {
  key?: string;
  title?: string;
};
type ListSort = {
  field?: SortFields;
  direction?: SortDirections;
};

type ListGroup = {
  field?: string;
};

export interface ListOptionsFilters {
  query?: string;
  queryHash?: string;
  textFilter?: ListTextFilters;
  sort?: ListSort;
  group?: ListGroup;
  hideClosed?: boolean;
}

export class ListOptions {
  queryString: string;
  hash: string;
  textFilter: Record<string, string> = {};
  sort: ListSort = {};
  group: ListGroup = { field: 'status' };
  hideClosed: boolean;
  constructor(query?: SavedSearchQuery);
  constructor(query?: SearchHistory);
  constructor(query?: string);
  constructor(query?: SavedSearchQuery | SearchHistory | string) {
    if (typeof query === 'string') {
      this.queryString = query;
    }
    if (query && typeof query !== 'string') {
      this.queryString = query.query_string;
      this.hash = query.hash;
    }
  }
}
