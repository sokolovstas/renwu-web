import { Pipe, PipeTransform } from '@angular/core';
import { Duration, formatDuration } from 'date-fns';
import durationFns from 'duration-fns';

type DurationFnsFormat = 'days' | 'hours' | 'minutes' | 'seconds';
type DurationFormat = 'hh:mm:ss' | 'hh:mm' | 'normalize';

const toHHMMSS = (secs: number, showSec = true) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor(secs / 60) % 60;
  const parts = [hours, minutes];
  if (showSec) {
    parts.push(secs % 60);
  }
  return parts
    .map((v) => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
};

@Pipe({ name: 'rwDurationToString', standalone: true })
export class RwDurationToStringPipe implements PipeTransform {
  static t(
    value: number,
    format: DurationFnsFormat[] | DurationFormat = 'normalize',
  ): string {
    if (!value) {
      return '-';
    }
    let duration: Duration = {};
    const numberValue = Number.parseInt(value.toString(), 10);
    if (isNaN(numberValue)) {
      return '-';
    } else {
      duration = {
        seconds: numberValue,
      };
    }

    switch (format) {
      case 'hh:mm:ss':
        return toHHMMSS(durationFns.toSeconds(duration));
      case 'hh:mm':
        return toHHMMSS(durationFns.toSeconds(duration), false);
      case 'normalize':
        return formatDuration(durationFns.normalize(duration));
      default:
        if (format.length === 1) {
          return formatDuration(
            { [format[0]]: durationFns.toUnit(duration, format[0]) },
            {
              format: format,
            },
          );
        } else {
          return formatDuration(durationFns.normalize(duration), {
            format: format,
          });
        }
    }
  }

  transform(
    value: number,
    format?: DurationFnsFormat[] | DurationFormat,
  ): string {
    return RwDurationToStringPipe.t(value, format);
  }
}
