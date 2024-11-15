import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import {
  ErrorHandler,
  inject,
  Injectable,
  Injector,
  isDevMode,
  NgModule,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import {
  NoPreloading,
  provideRouter,
  Router,
  RouteReuseStrategy,
  RouterModule,
} from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  provideTransloco,
  translocoConfig,
  TranslocoLoader,
  TranslocoModule,
} from '@ngneat/transloco';
import {
  RwAlertComponent,
  RwAlertService,
  RwModalContainerDirective,
  RwToastContainerComponent,
  RwToastService,
  RwTooltipContainerComponent,
} from '@renwu/components';
import { AvatarComponent, provideRenwuCore, StateService } from '@renwu/core';
import {
  provideRenwuMessaging,
  provideRenwuWebPush,
  RenwuWepPushService,
} from '@renwu/messaging';
import { filterFalsy } from '@renwu/utils';
import { takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CustomRouteReuseStrategy } from './app-route-reuse';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CheckForUpdateService } from './sw-check.service';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return import(`../i18n/${lang}.vendor.json`);
  }
}

@Injectable()
export class CustomErrorHandler extends ErrorHandler {
  constructor(private injector: Injector) {
    super();
  }
  get router(): Router {
    return this.injector.get<Router>(Router);
  }
  get toastService(): RwToastService {
    return this.injector.get<RwToastService>(RwToastService);
  }
  override handleError(err: any): void {
    super.handleError(err);
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AvatarComponent,
    SidebarComponent,
    RwAlertComponent,
    RwModalContainerDirective,
    RwToastContainerComponent,
    RwTooltipContainerComponent,
    TranslocoModule,
    RouterModule.forRoot(appRoutes, {
      paramsInheritanceStrategy: 'always',
      preloadingStrategy: NoPreloading,
    }),
    ServiceWorkerModule.register('./sw-master.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:5000',
    }),
    HttpClientModule,
  ],
  providers: [
    CheckForUpdateService,
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
    provideRenwuMessaging(),
    provideRenwuWebPush(),
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  update = inject(CheckForUpdateService);
  webPushService = inject(RenwuWepPushService);
  alert = inject(RwAlertService);
  stateService = inject(StateService);
  constructor() {
    this.stateService.keyboard.subscribe((v) => {
      if (v) {
        document.documentElement.classList.add('keyboard');
      } else {
        document.documentElement.classList.remove('keyboard');
      }
    });
    this.stateService.ready
      .pipe(takeUntil(this.stateService.ready.pipe(filterFalsy())))
      .subscribe(() => {
        const preloader = document.querySelector<HTMLDivElement>('.preloader');
        preloader.classList.add('fade-out');

        preloader.onanimationend = () => {
          if (preloader.classList.contains('fade-out')) {
            preloader.parentNode.removeChild(preloader);
          }
        };
      });
    this.update.checkUpdate();
    this.webPushService.askPermission();
  }
}
