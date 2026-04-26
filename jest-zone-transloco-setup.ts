import '@angular/localize/init';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

/**
 * Jest injects `beforeEach` at runtime. Native federation / app production
 * typecheck may load this file via path mappings without `@types/jest`; keep
 * a local signature so the Angular compiler does not fail (this file is
 * never bundled into the browser app).
 */
declare function beforeEach(fn: () => void): void;

setupZoneTestEnv();

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
      }),
    ],
  });
});
