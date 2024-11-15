export function selectFromRange(
  ranges: Range[],
  value: number,
  def: unknown = null,
): unknown {
  for (const range of ranges) {
    if (value <= range.max && value >= range.min) {
      return range.value;
    }
  }
  return def;
}

export interface Range {
  min: number;
  max: number;
  value: unknown;
}
