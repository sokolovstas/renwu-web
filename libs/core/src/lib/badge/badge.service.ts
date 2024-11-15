import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RwBadgeService {
  updateBadgeCount(messageCount: number): void {
    navigator.serviceWorker.controller?.postMessage({
      command: 'badge',
      value: messageCount,
    });
    try {
      (navigator as any).setAppBadge(messageCount);
    } catch (e) {
      return;
    }
    try {
      (navigator as any).setClientBadge(messageCount);
    } catch (e) {
      return;
    }
  }
}
