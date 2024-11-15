import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rwFilter',
})
export class RwFilterPipe implements PipeTransform {
  static t<T extends Record<string, any>>(
    value: Array<T>,
    search: string,
    fields: string[],
  ): Array<T> {
    if (Array.isArray(value)) {
      return value.filter((v) => {
        if (fields) {
          for (const f of fields) {
            try {
              return v[f].toLowerCase().indexOf(search.toLowerCase()) > -1;
            } catch (e) {
              return false;
            }
          }
        } else {
          try {
            return (
              v.toString().toLowerCase().indexOf(search.toLowerCase()) > -1
            );
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    }
    return [];
  }
  transform<T>(value: Array<T>, search: string, fields: string[]): Array<T> {
    return RwFilterPipe.t(value, search, fields);
  }
}
