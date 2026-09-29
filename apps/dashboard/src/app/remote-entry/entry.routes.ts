import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { RwQueryBuilderService, RwSearchService } from '@renwu/core';
import { MainComponent } from '../main/main.component';
import { ShellComponent } from '../shell/shell.component';

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
    component: ShellComponent,
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'dashboard',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
      RwQueryBuilderService,
      RwSearchService,
    ],
    children: [
      {
        path: '',
        component: MainComponent,
      },
      {
        path: ':id',
        component: MainComponent,
      },
    ],
  },
];
