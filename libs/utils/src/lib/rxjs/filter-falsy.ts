import { filter } from 'rxjs';

export const filterFalsy = <T>() => filter<T>((it) => !!it);
