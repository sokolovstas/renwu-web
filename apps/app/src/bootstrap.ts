import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  NoPreloading,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { provideUiTour } from 'ngx-ui-tour-console';
import { provideRenwuCore, StateService } from '@renwu/core';
import { provideRenwuMessaging, provideRenwuWebPush } from '@renwu/messaging';
import { environment } from '../../../environments/environment';
import { CustomRouteReuseStrategy } from './app/app-route-reuse';
import { CustomErrorHandler, TranslocoHttpLoader } from './app/app.module';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandler,
    },
    {
      provide: RouteReuseStrategy,
      useValue: new CustomRouteReuseStrategy(),
    },
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'ru', 'zh'],
        defaultLang: 'ru',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      }),
      loader: TranslocoHttpLoader,
    }),
    provideRenwuCore(environment),
    provideUiTour(),
    provideRenwuMessaging(),
    provideRenwuWebPush(),
    provideRouter(
      appRoutes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withPreloading(NoPreloading),
    ),
    provideHttpClient(),
    provideServiceWorker('./sw-master.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
}).catch((err) => console.error(err));
