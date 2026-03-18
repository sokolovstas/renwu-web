import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withRouterConfig,
} from '@angular/router';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { provideRenwuBoards } from '@renwu/board';
import { provideRenwuCore } from '@renwu/core';
import { environment } from '../../../environments/environment';
import { AppComponent } from './app/app.component';
import { TranslocoHttpLoader } from './app/app.module';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRenwuCore(environment),
    provideRenwuBoards(),
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
