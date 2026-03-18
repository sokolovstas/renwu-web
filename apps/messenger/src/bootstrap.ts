import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withRouterConfig,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { provideRenwuCore } from '@renwu/core';
import { provideRenwuMessaging, provideRenwuWebPush } from '@renwu/messaging';
import { environment } from '../../../environments/environment';
import { AppComponent } from './app/app.component';
import { TranslocoHttpLoader } from './app/app.module';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideRenwuCore(environment),
    provideRenwuMessaging(),
    provideRenwuWebPush(),
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
    provideServiceWorker('./sw-master.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
}).catch((err) => console.error(err));
