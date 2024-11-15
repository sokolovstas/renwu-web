import { Route } from '@angular/router';
import { InlineLoader, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { CalendarComponent } from '../calendar/calendar.component';
import { CalendarsComponent } from '../calendars/calendars.component';
import { DictionaryComponent } from '../dictionary/dictionary.component';
import { SettingsComponent } from '../settings/settings.component';
import { SystemComponent } from '../system/system.component';
import { UserComponent } from '../user/user.component';
import { UsersComponent } from '../users/users.component';
import { WorkflowComponent } from '../workflow/workflow.component';
import { WorkflowsComponent } from '../workflows/workflows.component';

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
    component: SettingsComponent,
    providers: [
      {
        provide: TRANSLOCO_SCOPE,
        useValue: {
          scope: 'settings',
          loader: createInlineLoader(['en', 'ru', 'zh']),
        },
      },
    ],
    children: [
      {
        path: 'system',
        component: SystemComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'users/:id',
        component: UserComponent,
      },
      {
        path: 'calendars',
        component: CalendarsComponent,
      },
      {
        path: 'calendars/:id',
        component: CalendarComponent,
      },
      {
        path: 'dictionary/:name',
        component: DictionaryComponent,
      },
      {
        path: 'workflows',
        component: WorkflowsComponent,
      },
      {
        path: 'workflows/:id',
        component: WorkflowComponent,
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'system',
  },
];
