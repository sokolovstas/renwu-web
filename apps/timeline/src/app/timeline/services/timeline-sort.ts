export type TimelineSortSetting = {
  field?: string;
  direction?: string;
};

/** Flat API sort: `status`, `-status`, `date_start_calc`, … */
export function timelineSortParam(
  sort?: TimelineSortSetting | null,
): string {
  const field = String(sort?.field || 'status');
  return sort?.direction === 'down' ? `-${field}` : field;
}
