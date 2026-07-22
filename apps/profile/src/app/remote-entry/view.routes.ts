import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { UserService } from '../user.service';
import { ViewChatComponent } from '../view/chat/chat.component';
import { ViewInfoComponent } from '../view/info/info.component';
import { ViewTasksComponent } from '../view/tasks/tasks.component';
import { ViewMainComponent } from '../view/view-main.component';

const createInlineLoader = (languages: Array<string>): InlineLoader => {
  const translocoInlineLoader: InlineLoader = {};

  languages.forEach((lang) => {
    translocoInlineLoader[lang] = () => {
      return import(`../../i18n/${lang}.json`);
    };
  });

  return translocoInlineLoader;
};

const setCurrentUser = (route: ActivatedRouteSnapshot) => {
  inject(UserService).currentUserKey.next(route.paramMap.get('username'));
};

/** Public user profile for `section:user/:username` (info / tasks / chat). */
export const VIEW_ROUTES: Route[] = [
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
    resolve: [setCurrentUser],
    component: ViewMainComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'info',
      },
      {
        path: 'info',
        component: ViewInfoComponent,
      },
      {
        path: 'tasks',
        component: ViewTasksComponent,
      },
      {
        path: 'chat',
        component: ViewChatComponent,
      },
    ],
  },
];
