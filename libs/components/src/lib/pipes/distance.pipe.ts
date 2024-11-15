import { Pipe, PipeTransform } from '@angular/core';
import { formatDistance, isValid, parseISO } from 'date-fns';

@Pipe({ name: 'rwTimeDistance', standalone: true })
export class RwTimeDistancePipe implements PipeTransform {
  // FIXME format
  static t(value: Date | string | number, format?: string): string {
    if (!value) {
      return '---';
    }
    if (isValid(new Date(value))) {
      return formatDistance(new Date(value), new Date());
    } else if (isValid(parseISO(value as string))) {
      return formatDistance(parseISO(value as string), new Date());
    }
    return '---';
  }

  transform(value: Date | string | number, format?: string): string {
    return RwTimeDistancePipe.t(value, format);
  }
}
