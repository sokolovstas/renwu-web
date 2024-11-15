import { SelectModelDictionary } from './dictionary';

export class SelectModelDictionaryID extends SelectModelDictionary {
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
