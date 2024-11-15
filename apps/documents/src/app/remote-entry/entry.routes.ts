import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { DocumentComponent } from '../document/document.component';
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
    pathMatch: 'full',
    component: MainComponent,
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'profile',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: '',
        component: DocumentComponent,
      },
      {
        path: ':documentId',
        component: DocumentComponent,
      },
    ],
  },
];
