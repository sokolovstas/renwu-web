import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
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
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'dashboard',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    component: MainComponent,
  },
];
