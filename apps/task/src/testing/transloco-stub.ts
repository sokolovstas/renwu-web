import { Pipe, PipeTransform } from '@angular/core';

/** Standalone stub so Jest does not load `@jsverse/transloco` ESM. */
@Pipe({
  name: 'transloco',
  standalone: true,
})
export class TranslocoPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

export class TranslocoServiceStub {
  translate(key: string): string {
    return key;
  }
}
