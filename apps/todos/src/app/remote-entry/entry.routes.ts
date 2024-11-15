import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { DetailComponent } from '../detail/detail.component';
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
          scope: 'todos',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: 'inbox',
        component: DetailComponent,
      },
      {
        path: 'today',
        component: DetailComponent,
      },
      {
        path: 'label/:label',
        component: DetailComponent,
      },
    ],
  },
];
