import { DestroyRef, assertInInjectionContext, inject } from '@angular/core';
import { Observable } from 'rxjs';

export function destroyObservable(destroyRef?: DestroyRef): Observable<void> {
  if (!destroyRef) {
    assertInInjectionContext(destroyObservable);
    destroyRef = inject(DestroyRef);
  }

  const destroyed$ = new Observable<void>((observer) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const unregisterFn = destroyRef!.onDestroy(observer.next.bind(observer));
    return unregisterFn;
  });

  return destroyed$;
}
