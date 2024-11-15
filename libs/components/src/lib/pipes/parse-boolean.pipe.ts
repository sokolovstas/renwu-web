import { Pipe, PipeTransform } from '@angular/core';
import { parseBoolean } from '@renwu/utils';

@Pipe({ name: 'rwParseBool', pure: false, standalone: true })
export class RwParseBooleanPipe implements PipeTransform {
  transform(value: string | number | boolean): boolean {
    return parseBoolean(value);
  }
}
