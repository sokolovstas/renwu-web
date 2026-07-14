import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { RwGroupService } from '@renwu/board';
import { RwQueryBuilderService, RwSearchService } from '@renwu/core';
import { BoardComponent } from '../board/board.component';
import { ListComponent } from '../list/list.component';
import { MainComponent } from '../main/main.component';

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
          scope: 'boards',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: ListComponent,
      },
      {
        path: ':id',
        component: BoardComponent,
        providers: [RwGroupService, RwQueryBuilderService, RwSearchService],
      },
    ],
  },
];
