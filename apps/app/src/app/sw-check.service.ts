import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { RwAlertService } from '@renwu/components';
import { RenwuWepPushService } from '@renwu/messaging';
import { interval } from 'rxjs';

@Injectable()
export class CheckForUpdateService {
  webPushService = inject(RenwuWepPushService);
  constructor(
    appRef: ApplicationRef,
    private updates: SwUpdate,
    private alertService: RwAlertService,
  ) {
    // Allow the app to stabilize first, before starting
    // polling for updates with `interval()`.
    // const appIsStable$ = appRef.isStable.pipe(
    //   first((isStable) => isStable === true)
    // );
    const everyHours = interval(60 * 60 * 1000);

    everyHours.subscribe(this.checkUpdate);
  }
  async checkUpdate() {
    try {
      const updateFound = await this.updates.checkForUpdate();
      console.log(
        updateFound
          ? 'A new version is available.'
          : 'Already on the latest version.',
      );
      if (updateFound) {
        this.alertService
          .confirm(
            'New version is available',
            'Reload app to update',
            true,
            'Reload',
            'Later',
          )
          .subscribe((v) => {
            if (v.affirmative) {
              window.location.reload();
            }
          });
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
    }
  }
}
