import {
  concat,
  ignoreElements,
  MonoTypeOperatorFunction,
  Observable,
  of,
  switchMap,
} from 'rxjs';

export function switchTap<T, R>(
  arg: Observable<R> | ((x: T) => Observable<R>),
): MonoTypeOperatorFunction<T> {
  const next: (x: any) => Observable<R> =
    typeof arg === 'function' ? arg : (x: any): Observable<R> => arg;
  return switchMap((value) =>
    concat(next(value).pipe(ignoreElements()), of(value)),
  );
}
