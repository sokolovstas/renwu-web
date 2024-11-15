import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'rwFormatArrayString', standalone: true })
export class RwFormatArrayStringPipe implements PipeTransform {
  transform(array: Array<string>, sparator = ', '): string {
    if (!array || array.length === 0) {
      return '-';
    }
    if (Array.isArray(array)) {
      let result = array.join(sparator);
      result = result.replaceAll('\n', '');
      result = result.replaceAll('\t', '');
      result = result.replace(/<.*?>/g, '');
      return result;
    } else {
      return array;
    }
  }
}
