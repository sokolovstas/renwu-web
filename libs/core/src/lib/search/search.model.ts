import { Issue } from '../issue/issue.model';

export interface SearchQuery {
  page_number?: number;
  page_size?: number;
  text?: string;
  query?: string;
  query_hash?: string;
}
export interface SearchResponse {
  facets?: null;
  hits?: SearchHit[];
  issues?: (Issue & { __score: number })[];
  max_score: number;
  query_hash: string;
  status?: SearchStatus;
  query?: string;
  took: number;
  total_hits: number;
}

export interface SearchHistory {
  id?: string;
  query_string: string;
  hash?: string;
  author_id?: string;
  query?: string;
  result?: string[];
  update?: string;
}

export interface SavedSearchQuery {
  id?: string;
  title?: string;
  query_string: string;
  hash?: string;
  author_id?: string;
  shared?: boolean;
  channel?: boolean;
  result?: string[];
  update?: string;
}

export interface Location {
  pos: number;
  start: number;
  end: number;
  array_positions: number[];
}

export interface SearchHit {
  index: string;
  id: string;
  score: number;
  sort: string;
  fields: { [key: string]: string };
  locations: { [key: string]: { [key: string]: Location } };
}

export interface SearchStatus {
  total: number;
  failed: number;
  successful: number;
}

export enum SearchHintType {
  // Internal use only
  PARAM = 'param',
  LOGIC = 'logic',
  RELOP = 'relop',
  SORT = 'sort',
  VALUE = 'value',
  RAW = 'raw',
  QUERY = 'query',
  QUERY_HISTORY = 'query-history',
}
export enum SearchParamType {
  // Internal use only
  LIST = 'list',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TEXT = 'text',
  SORT = 'sort',
}

export interface SearchHint {
  data: string;
  selected?: boolean;
  label: string;
  type: SearchHintType;
  start?: number;
  stop?: number;
  paramType?: SearchParamType;
}
