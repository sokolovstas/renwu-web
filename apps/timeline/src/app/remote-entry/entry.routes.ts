import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { MainComponent } from '../main/main.component';
import { TimelineComponent } from '../timeline/timeline.component';

const preloadTimelineI18n = (): Promise<string> => {
  const transloco = inject(TranslocoService);
  const scope = inject(TRANSLOCO_SCOPE);
  return firstValueFrom(transloco.selectTranslate('grouping', {}, scope));
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
    resolve: { timelineI18n: preloadTimelineI18n },
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'timeline',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: '',
        component: TimelineComponent,
      },
      {
        path: 'RW',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'activity',
          },
          {
            path: 'activity',
            component: TimelineComponent,
          },
        ],
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
