import { HttpClientModule } from '@angular/common/http';
import { Injectable, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  TranslocoLoader,
  TranslocoModule,
  provideTransloco,
  translocoConfig,
} from '@ngneat/transloco';
import { provideRenwuCore } from '@renwu/core';
import { provideRenwuMessaging, provideRenwuWebPush } from '@renwu/messaging';
import { environment } from '../../../../environments/environment';
import { AppComponent } from './app.component';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return import(`../i18n/${lang}.vendor.json`);
  }
}
@NgModule({
  declarations: [AppComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    TranslocoModule,
    RouterModule.forRoot(
      [
        {
          path: '',
          loadChildren: () =>
            import('./remote-entry/entry.routes').then((m) => m.ROUTES),
        },
      ],
      {
        initialNavigation: 'enabledBlocking',
        paramsInheritanceStrategy: 'always',
      },
    ),
    ServiceWorkerModule.register('./sw-master.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
