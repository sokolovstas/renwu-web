import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { DetailComponent } from '../detail/detail.component';

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
    path: ':key',
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'task',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    component: DetailComponent,
  },
];
