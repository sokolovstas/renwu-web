import { Inject, Injectable, inject } from '@angular/core';
import '@angular/localize/init';
import { TranslocoService } from '@ngneat/transloco';
import { RwToastService } from '@renwu/components';
import { RxWebsocketSubject } from '@renwu/utils';
import { BehaviorSubject, Subject, filter } from 'rxjs';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';
import {
  ConnectionEvents,
  ContainerEvent,
  ContainerEventType,
  CoreEventWrapper,
  CoreSendCommand,
  IssueEvent,
  IssueEventType,
  UserEvent,
  WorkbotEvent,
} from './websocket.model';

@Injectable({
  providedIn: 'root',
})
export class RwWebsocketService {
  transloco = inject(TranslocoService);

  token = '';
  tenant = '';
  connected = new BehaviorSubject<boolean>(false);
  subject: RxWebsocketSubject<CoreSendCommand, CoreEventWrapper>;
  displayDisconnected: boolean;
  viewPath = '';
  viewIDs = new Map<ViewType, Set<string>>();

  issue: Subject<IssueEvent> = new Subject<IssueEvent>();
  container: Subject<ContainerEvent> = new Subject<ContainerEvent>();
  connections: Subject<ConnectionEvents> = new Subject<ConnectionEvents>();
  workbot: Subject<WorkbotEvent> = new Subject<WorkbotEvent>();
  user: Subject<UserEvent> = new Subject<UserEvent>();

  constructor(
    private toastService: RwToastService,
    @Inject(RW_CORE_SETTINGS) private settings: RwCoreSettings,
  ) {
    this.viewPath = '';
    this.viewIDs = new Map<ViewType, Set<string>>();
  }
  create(): void {
    if (this.subject) {
      this.subject.complete();
    }

    this.token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('renwu-auth'))
      ?.split('=')[1];

    this.subject = new RxWebsocketSubject(
      `${this.settings.wsServerUrl}?renwu-token=${this.token}`,
    );

    this.subject.connectionStatus.subscribe((isConnected) => {
      this.connected.next(isConnected);
      if (isConnected && this.displayDisconnected) {
        this.webscoketConnected();
      } else if (!isConnected) {
        this.webscoketDisconnected();
      }
    });

    if (this.settings.isDebug) {
      this.subject.subscribe((value) => {
        console.log('Incoming core socket message:');
        console.log(JSON.stringify(value));
      });
    }

    this.subject.subscribe((event: CoreEventWrapper) => {
      switch (event.type) {
        case 'issue':
          this.issue.next(event.data);
          return;
        case 'container':
          this.container.next(event.data);
          return;
        case 'connections':
          this.connections.next(event.data);
          return;
        case 'workbot':
          this.workbot.next(event.data);
          return;
        case 'user':
          this.user.next(event.data);
          return;
      }
    });
  }
  onIssueEvent(
    ids: string[] = ['*'],
    events: (IssueEventType | '*')[] = ['*'],
  ) {
    return this.issue.pipe(
      filter((e) => {
        const idInt =
          ids[0] === '*' ||
          ids.filter((x) => [...e.issues, e.container].includes(x)).length > 0;
        const eventInt = events[0] === '*' || events.includes(e.type);
        return idInt && eventInt;
      }),
    );
  }
  onContainerEvent(
    ids: string[] = ['*'],
    events: (ContainerEventType | '*')[] = ['*'],
  ) {
    return this.container.pipe(
      filter((e) => {
        const idInt =
          ids[0] === '*' ||
          ids.filter((x) => [e.container].includes(x)).length > 0;
        const eventInt = events[0] === '*' || events.includes(e.type);
        return idInt && eventInt;
      }),
    );
  }
  webscoketDisconnected(): void {
    this.toastService.error(
      this.transloco.translate('Realtime sync disconnected'),
    );
    this.displayDisconnected = true;
  }
  webscoketConnected(): void {
    if (this.viewPath) {
      this.sendView();
    }
    this.toastService.success(
      this.transloco.translate('Realtime sync connected'),
    );
    this.toastService.clear(
      this.transloco.translate('Realtime sync disconnected'),
    );
    this.displayDisconnected = false;
  }
  send<T extends CoreSendCommand>(
    command: T['command'],
    data: T['data'],
  ): void {
    const payload = { command: command, data: data };
    if (this.settings.isDebug) {
      console.log('Send to core socket:');
      console.log(JSON.stringify(payload));
    }
    if (this.subject) {
      this.subject.send(payload);
    }
  }
  clearView(): void {
    this.viewPath = '';
  }
  pushView(path: string): void {
    this.viewPath = path;
  }
  pushId(view: ViewType, id: string): void {
    if (!this.viewIDs.has(view)) {
      this.viewIDs.set(view, new Set());
    }
    this.viewIDs.get(view).add(id);
  }
  clearId(view: ViewType) {
    this.viewIDs.set(view, new Set());
  }
  sendView(): void {
    console.log(this.viewIDs);
    this.send('view', {
      path: this.viewPath,
      ids: Array.from(this.viewIDs.values())
        .map((s) => Array.from(s.values()))
        .flat(),
    });
  }
}

export type ViewType = 'issuedetail' | 'route' | 'issuelist';
