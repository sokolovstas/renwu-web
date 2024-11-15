import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { RwAlertService } from '@renwu/components';
import { RwBadgeService, RwDataService, StateService } from '@renwu/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { RwMessagingDataService } from './data/messaging-data.service';
import { RwMessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class RenwuWepPushService {
  swPush = inject(SwPush);
  dataService = inject(RwDataService);
  messagingDataService = inject(RwMessagingDataService);
  alert = inject(RwAlertService);
  messageService = inject(RwMessageService);
  badgeService = inject(RwBadgeService);
  stateService = inject(StateService);
  private serverPublicKey = '';

  isSupported = () => 'Notification' in window;
  getPermisson() {
    return window.Notification?.permission ?? 'granted';
  }

  async requestPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }

    return Promise.resolve('granted');
  }

  askPermission() {
    if (this.getPermisson() === 'default') {
      setTimeout(() => {
        this.alert
          .confirm(
            'Push notifications',
            'Do you want to activate push notifications?',
          )
          .subscribe(async (v) => {
            if (v.affirmative) {
              const permission = await this.requestPermission();
              if (permission === 'granted') {
                this.subscribe();
              }
            }
          });
      }, 1000);
    }
    if (this.getPermisson() === 'denied') {
      this.alert.alert('Notification blocked', '');
    }
    if (this.getPermisson() === 'granted') {
      this.subscribe();
    }
  }

  async create(serverPublicKey?: string) {
    this.serverPublicKey = serverPublicKey ?? this.serverPublicKey;
    if (this.getPermisson() === 'granted') {
      return this.subscribe();
    }
  }

  async subscribe() {
    combineLatest([
      this.messageService.unreadCount,
      this.messageService.pulseCount,
    ])
      .pipe(
        map(([u, p]) => u + p),
        distinctUntilChanged(),
      )
      .subscribe((c) => this.badgeService.updateBadgeCount(c));

    if (!this.serverPublicKey) {
      return;
    }

    navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {
      const options = {
        userVisibleOnly: true,
        applicationServerKey: this.serverPublicKey,
      };
      if (serviceWorkerRegistration.pushManager) {
        serviceWorkerRegistration.pushManager.subscribe(options).then(
          (pushSubscription) => {
            this.messagingDataService
              .registerWebPushDevice(pushSubscription.toJSON())
              .subscribe();
          },
          (error) => {
            console.error('Could not subscribe to notifications', error);
          },
        );
      }
    });
  }

  // Notifications
  // async sendNotification(messageEvent: MessageEvent) {
  //   if (this.stateService.htmlNotify.getValue()) {
  //     if (
  //       this.stateService.focused.getValue() ||
  //       !messageEvent.chat ||
  //       (messageEvent.chat && !messageEvent.chat.destination) ||
  //       messageEvent.eventType !== MessageEventType.CHAT
  //     ) {
  //       return;
  //     }
  //     // Send notify if not focused
  //     const destination = await firstValueFrom(
  //       this.messageService.getDestination(messageEvent.chat.destination.id)
  //     );
  //     if (
  //       (messageEvent.chat.destination.type === DestinationType.ISSUE ||
  //         messageEvent.chat.destination.type === DestinationType.USER) &&
  //       messageEvent.chat.unread_count &&
  //       ((destination &&
  //         (!destination.info.unread_count ||
  //           destination.info.unread_count < messageEvent.chat.unread_count)) ||
  //         !destination)
  //     ) {
  //       this.messageService
  //         .loadMessages(undefined, messageEvent.chat.destination, 1, 0, false)
  //         .subscribe((result) => {
  //           let notification: Notification;
  //           try {
  //             notification = new window.Notification(
  //               `${messageEvent.chat.name}`,
  //               {
  //                 tag: messageEvent.chat.name,
  //                 renotify: true,
  //                 body: result.messages[0].message,
  //               }
  //             );
  //           } catch (e) {
  //             notification = new window.Notification(
  //               `New message in chat: "${messageEvent.chat.name}"`,
  //               {
  //                 tag: messageEvent.chat.name,
  //                 renotify: true,
  //               }
  //             );
  //           }

  //           let name = messageEvent.chat.destination.id;
  //           // let type: string;
  //           if (messageEvent.chat.destination.type === DestinationType.USER) {
  //             // type = 'user';
  //             name = messageEvent.chat.name;
  //           } else {
  //             // type = 'issue';
  //             const array = messageEvent.chat.name.split('|');
  //             if (array.length > 0) {
  //               name = array[0].trim();
  //             }
  //           }
  //           notification.onclick = () => {
  //             notification.close();
  //             // this.stateService.messagingOpened.next(true);
  //             // this.messageService.setSelectedDestinationInfo(messageEvent.chat);
  //           };
  //         });
  //     }
  //   }
  // }
}
