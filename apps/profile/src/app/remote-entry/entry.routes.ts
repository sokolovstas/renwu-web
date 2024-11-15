import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { MainComponent } from '../main/main.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { SettingsComponent } from '../settings/settings.component';
import { UserService } from '../user.service';

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};

  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => {
      return import(`../../i18n/${lang}.json`);
    };
  });

  return translocoInlineLoader;
};

const setCurrentProject = (route: ActivatedRouteSnapshot) => {
  inject(UserService).currentUserKey.next(route.paramMap.get('username'));
};

export const ROUTES: Route[] = [
  {
    path: ':username',
    providers: [
      UserService,
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'profile',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],

    resolve: [setCurrentProject],
    component: MainComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'settings',
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'me/settings',
  },
];
