import { Pipe, PipeTransform } from '@angular/core';
import type { TranslocoService } from '@jsverse/transloco';

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

/** `TranslocoService` is not `providedIn: 'root'`; use in component TestBed providers. */
export function provideTranslocoStub(): {
  provide: typeof TranslocoService;
  useValue: TranslocoService;
} {
  // Resolve the injection token lazily so we do not import `@jsverse/transloco` while
  // `test-setup-mocks.ts` is still constructing the jest mock (circular require → broken token).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TranslocoService: TranslocoServiceToken } =
    require('@jsverse/transloco') as typeof import('@jsverse/transloco');
  return {
    provide: TranslocoServiceToken,
    useValue: new TranslocoServiceStub() as unknown as TranslocoService,
  };
}
