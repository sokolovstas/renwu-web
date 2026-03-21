import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withRouterConfig,
} from '@angular/router';
import { provideRenwuCore } from '@renwu/core';
import { environment } from '../../../environments/environment';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRenwuCore(environment),
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
