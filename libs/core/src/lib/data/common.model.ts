export const ResultOK = 'OK';
export interface ResponseOk {
  result: typeof ResultOK;
}

export interface StringResult {
  result: string;
}

export interface OptionsResponse<T> {
  count: number;
  next: number;
  previous: number;
  results: T[];
}

export interface SortData {
  sort: { id: string; sort: number }[];
}
export interface SystemSettings {
  limit_user_to_container: boolean;
  _id: 'system';
}
