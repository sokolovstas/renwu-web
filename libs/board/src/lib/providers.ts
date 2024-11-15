import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RwBoardService } from './board.service';

function initBoards(): () => Promise<void> {
  const boardService = inject(RwBoardService);

  return async (): Promise<void> => {
    await firstValueFrom(boardService.init());
  };
}

export function provideRenwuBoards(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: APP_INITIALIZER,
      useFactory: initBoards,
      multi: true,
    },
  ];

  return makeEnvironmentProviders(providers);
}
