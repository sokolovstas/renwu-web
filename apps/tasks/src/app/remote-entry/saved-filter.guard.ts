import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { RwDataService } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

/**
 * Open a saved filter by its own id.
 * The list endpoint can fail independently (dev currently 500s while decoding
 * `update`), and that must not bounce a real filter back to an empty index.
 */
export const checkEmptyFilter = async (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id');
  if (!id) {
    return true;
  }
  const query = await firstValueFrom(
    inject(RwDataService).getSearchQuery(id).pipe(defaultIfEmpty(null)),
  );
  if (!query?.id) {
    return createUrlTreeFromSnapshot(route, ['..']);
  }
  return true;
};
