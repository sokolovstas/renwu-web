import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'rwObjectKeys', pure: false, standalone: true })
export class RwObjectKeysPipe implements PipeTransform {
  transform(value: Record<string, unknown>): string[] {
    return Object.keys(value);
  }
}
