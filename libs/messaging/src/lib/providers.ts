import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { RwMessagingDataService } from './data/messaging-data.service';
import { RenwuWepPushService } from './html-notification.service';
import { RwMessageService } from './message.service';

function initMessenger(): () => Promise<void> {
  const messageService = inject(RwMessageService);

  return async (): Promise<void> => {
    messageService.create();
  };
}

function initWebPushApp(): () => Promise<void> {
  const dataService = inject(RwMessagingDataService);
  const pushService = inject(RenwuWepPushService);

  return async (): Promise<void> => {
    await firstValueFrom(
      dataService.getWebPushSettings().pipe(
        tap((settings) => pushService.create(settings.web_push_public)),
        catchError(() => of(false)),
      ),
    );
  };
}

export function provideRenwuMessaging(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: initMessenger,
      multi: true,
    },
  ];

  return makeEnvironmentProviders(providers);
}

export function provideRenwuWebPush(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: initWebPushApp,
      multi: true,
    },
  ];

  return makeEnvironmentProviders(providers);
}
