import { Injectable } from '@angular/core';
import { Strings } from '@renwu/utils';
import { SelectModelDictionary } from './dictionary';

@Injectable({
  providedIn: 'root',
})
export class SelectModelIssue extends SelectModelDictionary {
  getDataForDisplay(source: any): any {
    return source.data.key + ' - ' + Strings.escape(source.data.title);
  }
  getDataForDisplayNotEscape(source: any): any {
    return source.data.key + ' - ' + source.data.title;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
}
