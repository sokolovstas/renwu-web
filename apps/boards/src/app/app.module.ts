import { HttpClientModule } from '@angular/common/http';
import { Injectable, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import {
  TranslocoLoader,
  provideTransloco,
  translocoConfig,
} from '@ngneat/transloco';
import { provideRenwuBoards } from '@renwu/board';
import { provideRenwuCore } from '@renwu/core';
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
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
