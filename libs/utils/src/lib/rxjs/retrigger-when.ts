import { Observable, concat, map, of, skip, switchMap } from 'rxjs';

export const retriggerWhen = <T>(
  notifier: Observable<any>,
  skipFirst = false,
) =>
  switchMap<T, Observable<T>>((v) => {
    if (skipFirst)
      concat(
        of(v),
        notifier.pipe(
          map(() => v),
          skip(1),
        ),
      );
    return concat(of(v), notifier.pipe(map(() => v)));
  });
