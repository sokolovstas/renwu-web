import { Pipe, PipeTransform } from '@angular/core';
import { Locale, format, isValid, parseISO } from 'date-fns';
import { enGB } from 'date-fns/locale/en-GB';
import { enUS } from 'date-fns/locale/en-US';
import { ru } from 'date-fns/locale/ru';
import { zhCN } from 'date-fns/locale/zh-CN';
import { RwTimeDistancePipe } from './distance.pipe';

export enum AppDateFormat {
  EN_GB = 'en-GB',
  EN_US = 'en-US',
  ZH_CN = 'zh-CN',
  RU = 'ru',
}
@Pipe({ name: 'rwDate', standalone: true })
export class RwDatePipe implements PipeTransform {
  static locale: Locale;

  static async setLocale(language: AppDateFormat) {
    try {
      switch (language) {
        case AppDateFormat.EN_GB:
          RwDatePipe.locale = enGB;
          break;
        case AppDateFormat.EN_US:
          RwDatePipe.locale = enUS;
          break;
        case AppDateFormat.ZH_CN:
          RwDatePipe.locale = zhCN;
          break;
        case AppDateFormat.RU:
          RwDatePipe.locale = ru;
          break;
      }
    } catch (e) {
      RwDatePipe.locale = enGB;
    }
  }
  static t(
    value: Date | string | number,
    formatString?: string | 'fromNow',
  ): string {
    if (!formatString) {
      formatString = 'PPP pp';
    }
    if (!value) {
      return '---';
    }
    let result = null;
    if (formatString === 'fromNow') {
      return RwTimeDistancePipe.t(value);
    }
    if (isValid(new Date(value))) {
      result = new Date(value);
    } else if (isValid(parseISO(value as string))) {
      result = parseISO(value as string);
    }
    if (isValid(result)) {
      if (result.getTime() < 0) {
        return '---';
      }
      return format(result, formatString, { locale: RwDatePipe.locale });
    }

    return '---';
  }

  transform(
    value: Date | string | number,
    format?: string | 'fromNow',
  ): string {
    return RwDatePipe.t(value, format);
  }
}
