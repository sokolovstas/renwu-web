import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { RwDataService } from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { ListComponent } from '../list/list.component';
import { MainComponent } from '../main/main.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { TreeComponent } from '../tree/tree.component';

const checkEmptyFilter = async (route: ActivatedRouteSnapshot) => {
  const queries = await firstValueFrom(
    inject(RwDataService).getSearchQueries(),
  );
  if (queries.findIndex((v) => v.id === route.paramMap.get('id')) === -1) {
    return createUrlTreeFromSnapshot(route, ['..', queries[0].id]);
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
        path: 'list/:id',
        canActivate: [checkEmptyFilter],
        component: ListComponent,
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
        redirectTo: 'list/',
      },
    ],
  },
];
