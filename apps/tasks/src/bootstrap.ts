import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withRouterConfig,
} from '@angular/router';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { provideRenwuCore } from '@renwu/core';
import { provideRenwuMessaging } from '@renwu/messaging';
import { environment } from '../../../environments/environment';
import { AppComponent } from './app/app.component';
import { TranslocoHttpLoader } from './app/app.module';
import { provideUiTour } from 'ngx-ui-tour-console';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideUiTour(),
    provideRenwuCore(environment),
    provideRenwuMessaging(),
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'ru', 'zh'],
        defaultLang: 'ru',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      }),
      loader: TranslocoHttpLoader,
    }),
    provideRouter(
      [
        {
          path: '',
          loadChildren: () =>
            import('./app/remote-entry/entry.routes').then((m) => m.ROUTES),
        },
      ],
      withEnabledBlockingInitialNavigation(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
  ],
}).catch((err) => console.error(err));
