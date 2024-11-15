import { Injectable } from '@angular/core';
import { UserStatic } from '../user/user.model';

@Injectable({
  providedIn: 'root',
})
export class RwFormatService {
  formatters: { [index: string]: any } = {};

  constructor() {
    this.formatters['Milestone'] = MilestoneFormatter;
    this.formatters['User'] = UserFormatter;
    this.formatters['Dictionary'] = DictionaryFormatter;
    this.formatters['Container'] = DictionaryContainerFormatter;
    this.formatters['DictionaryID'] = DictionaryIDFormatter;
    this.formatters['String'] = StringFormatter;
    this.formatters['DictionaryString'] = DictionaryStringFormatter;
    this.formatters['Issue'] = IssueFormatter;
    this.formatters['DictionaryTransition'] = TransitionFormatter;
    this.formatters['Default'] = DefaultFormatter;
  }

  getFormatterByName(name: string): BaseFormatter {
    const formatterClass = this.formatters[name];
    return new formatterClass();
  }
}

export interface BaseFormatter {
  getDataForDisplay: Function;
  getDataForDisplayNotEscape: Function;
  getDataForSearch: Function;
  getDataForSave: Function;
  convertToData: Function;
  convertOption: Function;
  getID: Function;
  compareForSearch: Function;
}

export class MainFormatter {
  escape(source: string): string {
    if (source && source.replace) {
      return source
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else {
      return source;
    }
  }
  getDataForSave(source: any): any {
    let ret: any = source;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        if (source[i] && source[i].data) {
          ret.push(source[i].data);
        }
      }
    } else if (source && source.data) {
      ret = source.data;
    }
    return ret;
  }
  compareForSearch(itemA: any, itemB: any, search: string) {
    return 0;
  }
}

// Title or label
export class DictionaryFormatter extends MainFormatter {
  getDataForDisplay(source: any): any {
    return super.escape(this.getDataForDisplayNotEscape(source));
  }
  getDataForDisplayNotEscape(source: any): any {
    return source?.label;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source) || '';
  }
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        ret.push({
          id: source[i].id,
          label: source[i].title || source[i].label,
          data: source[i].data || source[i],
        });
      }
    } else {
      ret = {
        id: source.id,
        label: source.title || source.label,
        data: source.data || source,
      };
    }
    return ret;
  }
  convertOption(option: any[], requestFilters: {}) {
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].id,
        label: option[i].title || option[i].label,
        data: option[i],
      });
    }
    return ret;
  }
  getID(source: any): any {
    if (!source) {
      return;
    }
    return source.id;
  }
}

export class DictionaryContainerFormatter extends DictionaryFormatter {
  getDataForDisplayNotEscape(source: any): any {
    return `${source.label} (${source.data.key})`;
  }
}

export class DictionaryIDFormatter extends DictionaryFormatter {
  options: any[];
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Array.isArray(source)) {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        const item = this.options.find((o) => o.data === source[i]);
        if (item) {
          ret.push(item);
        }
      }
    } else {
      ret = this.options.find((o) => o.data === source);
    }
    return ret;
  }
  convertOption(option: any[], requestFilters: {}) {
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].id,
        label: option[i].title || option[i].label,
        data: option[i].id,
      });
    }
    this.options = ret;
    return ret;
  }
  getDataForSave(source: any): any {
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        if (source[i]) {
          ret.push(source[i].data);
        }
      }
    } else if (source) {
      ret = source.data;
    }
    return ret;
  }
}

export class MilestoneFormatter extends DictionaryFormatter {
  convertOption(option: any[], requestFilters: {}) {
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].id,
        label: this.getTitle(option[i]),
        data: option[i],
      });
    }
    if (
      requestFilters &&
      requestFilters['container'] &&
      requestFilters['container'].id
    ) {
      const current = ret.filter((item) => {
        return item.data.container.id === requestFilters['container'].id;
      });
      const another = ret.filter((item) => {
        return item.data.container.id !== requestFilters['container'].id;
      });
      return [...current, ...another];
    } else {
      return ret;
    }
  }
  getTitle(item: any): string {
    return `${item.title} (${item.container.key})`;
  }
  getDataForSearch(source: any): any {
    const titleWithoutDots = source.data.title.replace(/\./g, '');
    return `${source.data.title} ${titleWithoutDots} ${source.data.container.title} ${source.data.container.key}`;
  }
}

export class IssueFormatter extends DictionaryFormatter {
  getDataForDisplay(source: any): any {
    return source.data.key + ' - ' + super.escape(source.data.title);
  }
  getDataForDisplayNotEscape(source: any): any {
    return source.data.key + ' - ' + source.data.title;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
}

export class UserFormatter extends MainFormatter {
  getDataForDisplay(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
  getDataForDisplayNotEscape(source: any): any {
    if (!source) {
      return;
    }
    return source.label;
  }
  getDataForSearch(source: any): any {
    return UserStatic.getSearchString(source.data);
  }
  getLabel(source: any) {
    let ret = '';
    ret += '<div>';
    if (source.type === 'external') {
      ret += '<i class="icon-team"></i>&nbsp;';
    }
    if (source.full_name && source.full_name.trim()) {
      ret += source.full_name;
    } else if (source.username) {
      ret += source.username;
    }
    ret += '</div>';
    // if (source.username) {
    //   ret += `<div><small>${source.username}</small></div>`;
    // }
    return ret;
  }
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        ret.push({
          id: source[i].id,
          label: this.getLabel(source[i]),
          data: source[i].data ? source[i].data : source[i],
        });
      }
    } else {
      ret = {
        id: source.id,
        label: this.getLabel(source),
        data: source.data ? source.data : source,
      };
    }
    return ret;
  }
  convertOption(option: any[]) {
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].id,
        label: this.getLabel(option[i]),
        data: option[i],
      });
    }
    ret.sort((a: any, b: any): number => {
      if (a.data.type === b.data.type) {
        return 0;
      }
      if (a.data.type === 'external') {
        return 1;
      }
      return -1;
    });
    return ret;
  }
  compareForSearch(itemA: any, itemB: any, search: string) {
    return UserStatic.compareForSearch(itemA.data, itemB.data, search);
  }
  getID(source: any): any {
    if (!source) {
      return;
    }
    return source.id;
  }
}

export class StringFormatter extends MainFormatter {
  getDataForDisplay(source: any): any {
    return super.escape(this.getDataForDisplayNotEscape(source));
  }
  getDataForDisplayNotEscape(source: any): any {
    return source;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
  getDataForSave(source: any): any {
    return source;
  }
  convertToData(source: any): any {
    return source;
  }
  convertOption(option: any[]) {
    return option;
  }
  getID(source: any): any {
    return source;
  }
}

export class DictionaryStringFormatter extends MainFormatter {
  getDataForSave(source: any): any {
    if (!source) {
      return '';
    }
    let ret: any = source;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        if (source[i].data) {
          ret.push(source[i].data);
        }
      }
    } else if (source && source.data) {
      ret = source.data;
    }
    return ret;
  }
  getDataForDisplay(source: any): any {
    return super.escape(this.getDataForDisplayNotEscape(source));
  }
  getDataForDisplayNotEscape(source: any): any {
    if (!source) {
      return '';
    }
    return source.label;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        ret.push({
          id: source[i].id ? source[i].id : source[i],
          label: source[i].label ? source[i].label : source[i],
          data: source[i].data ? source[i].data : source[i],
        });
      }
    } else {
      ret = {
        id: source.id ? source.id : source,
        label: source.label ? source.label : source,
        data: source.data ? source.data : source,
      };
    }
    return ret;
  }
  convertOption(option: any[]): any[] {
    if (!option) {
      return [];
    }
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i],
        label: option[i],
        data: option[i],
      });
    }
    return ret;
  }
  getID(source: any): any {
    if (!source) {
      return;
    }
    return source.id ? source.id : source;
  }
}

export class TransitionFormatter extends MainFormatter {
  getDataForDisplay(source: any): any {
    return super.escape(this.getDataForDisplayNotEscape(source));
  }
  getDataForDisplayNotEscape(source: any): any {
    if (!source) {
      return;
    }
    return source.label;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
  getDataForSave(source: any): any {
    let ret: any = source;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        if (source[i].data) {
          ret.push(source[i].data);
        }
      }
    } else if (source && source.data) {
      ret = source.data;
    }
    return ret;
  }
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        ret.push({
          id: source[i].id,
          label: source[i].label,
          data: source[i].data ? source[i].data : source[i],
        });
      }
    } else {
      if (typeof source === 'string') {
        ret = {
          id: source,
          label: source,
          data: source,
        };
      } else {
        ret = {
          id: source.id,
          label: source.label,
          data: source.data ? source.data : source,
        };
      }
    }
    return ret;
  }
  convertOption(option: any[]) {
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].to.id,
        label: option[i].label || option[i].to.label,
        data: option[i].to,
      });
    }
    return ret;
  }
  getID(source: any): any {
    if (!source) {
      return;
    }
    return source.id;
  }
}

export class DefaultFormatter extends MainFormatter {
  getDataForDisplay(source: any): any {
    return super.escape(this.getDataForDisplayNotEscape(source.label));
  }
  getDataForDisplayNotEscape(source: any): any {
    return source.label;
  }
  getDataForSearch(source: any): any {
    return this.getDataForDisplayNotEscape(source);
  }
  convertToData(source: any): any {
    if (!source) {
      return;
    }
    let ret: any;
    if (Object.prototype.toString.call(source) === '[object Array]') {
      ret = [];
      for (let i = 0; i < source.length; ++i) {
        ret.push({
          id: source[i].id,
          label: source[i].label,
          data: source[i].data ? source[i].data : source[i],
        });
      }
    } else {
      ret = {
        id: source.id,
        label: source.label,
        data: source.data ? source.data : source,
      };
    }
    return ret;
  }
  convertOption(option: any[]): any[] {
    if (!option) {
      return [];
    }
    const ret: any[] = [];
    for (let i = 0; i < option.length; ++i) {
      ret.push({
        id: option[i].id,
        label: option[i].label,
        data: option[i],
      });
    }
    return ret;
  }
  getID(source: any): any {
    if (!source) {
      return;
    }
    return source.id;
  }
}
