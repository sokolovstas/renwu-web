import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { RwDataService, RwQueryBuilderService, RwSearchService } from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { FiltersListComponent } from '../filters-list/filters-list.component';
import { ListComponent } from '../list/list.component';
import { MainComponent } from '../main/main.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { TreeComponent } from '../tree/tree.component';

const checkEmptyFilter = async (route: ActivatedRouteSnapshot) => {
  const queries = await firstValueFrom(
    inject(RwDataService).getSearchQueries(),
  );
  const id = route.paramMap.get('id');

  if (!id) {
    return true;
  }

  if (!queries?.length || queries.findIndex((v) => v.id === id) === -1) {
    return createUrlTreeFromSnapshot(route, ['..']);
  }
  return true;
};

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};

  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => {
      return import(`../../i18n/${lang}.json`);
    };
  });

  return translocoInlineLoader;
};

export const ROUTES: Route[] = [
  {
    path: '',
    component: MainComponent,
    providers: [
      RwSearchService,
      RwQueryBuilderService,
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'tasks',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: 'list',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: FiltersListComponent,
          },
          {
            path: ':id',
            canActivate: [checkEmptyFilter],
            component: ListComponent,
          },
        ],
      },
      {
        path: 'timeline',
        component: TimelineComponent,
      },
      {
        path: 'tree',
        component: TreeComponent,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
    ],
  },
];
