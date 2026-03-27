import { Injector } from '@angular/core';
import { StateService } from '@renwu/core';
import { RenwuWepPushService } from '@renwu/messaging';
import { filterFalsy } from '@renwu/utils';
import { first, take, takeUntil } from 'rxjs';
import { CheckForUpdateService } from './sw-check.service';

export function runShellAppInitializers(injector: Injector): void {
  const stateService = injector.get(StateService);
  const update = injector.get(CheckForUpdateService);
  const webPushService = injector.get(RenwuWepPushService);

  stateService.keyboard.subscribe((v) => {
    if (v) {
      document.documentElement.classList.add('keyboard');
    } else {
      document.documentElement.classList.remove('keyboard');
    }
  });
  stateService.ready
    .pipe(filterFalsy(), first())
    .subscribe(() => {
      const preloader = document.querySelector<HTMLDivElement>('.preloader');
      if (!preloader) {
        return;
      }
      preloader.classList.add('fade-out');
      preloader.onanimationend = () => {
        if (preloader.classList.contains('fade-out')) {
          preloader.parentNode?.removeChild(preloader);
        }
      };
    });
  update.checkUpdate();
  webPushService.askPermission();
}
