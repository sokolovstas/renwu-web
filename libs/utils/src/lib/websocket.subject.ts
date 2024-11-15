import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import {
  debounceTime,
  filter,
  mergeMap,
  share,
  startWith,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { JSONUtils } from './json';

export class RxWebsocketSubject<IN, OUT> extends Subject<OUT> {
  private reconnectionObservable: Observable<number> = null;
  private wsSubjectConfig: WebSocketSubjectConfig<IN | OUT[]>;
  private socket: WebSocketSubject<IN | OUT[]> | null = null;
  public connectionStatus = new BehaviorSubject<boolean>(null);
  public timeout = {
    timeout_interval_ping: 10000,
    timeout_wait_pong: 20000,
  };

  timeId = 0;
  connectionTimeout = 10000;

  defaultDeserializer = (e: MessageEvent<string>): OUT[] => {
    return JSONUtils.parse<OUT[]>(`[${e.data.split('\n').toString()}]`, []);
  };

  defaultSerializer = (data: IN): string => {
    return JSON.stringify(data);
  };

  constructor(
    private url: string,
    private reconnectInterval = 1000,
    private reconnectAttempts = Number.MAX_VALUE - 1,
    private deserializer?: (e: MessageEvent) => OUT[],
    private serializer?: (data: IN) => string,
  ) {
    super();

    window.addEventListener(
      'offline',
      () => {
        this.connectionStatus.next(false);
      },
      false,
    );

    window.addEventListener(
      'online',
      () => {
        this.connectionStatus.next(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        this.send({ command: 'ping' } as any);
      },
      false,
    );

    if (window.onbeforeunload) {
      window.onbeforeunload = () => {
        this.socket.complete();
      };
    }

    this.wsSubjectConfig = {
      url: url,
      closeObserver: {
        next: () => {
          this.socket = null;
          if (!this.timeId) {
            this.timeId = globalThis.setTimeout(() => {
              this.connectionStatus.next(false);
            }, this.connectionTimeout);
          }
        },
      },
      openObserver: {
        next: () => {
          if (this.timeId) {
            globalThis.clearTimeout(this.timeId);
            this.timeId = 0;
          }
          this.connectionStatus.next(true);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
          this.send({ command: 'ping' } as any);
        },
      },
      deserializer: deserializer || this.defaultDeserializer,
      serializer: (serializer || this.defaultSerializer) as (
        value: IN | OUT[],
      ) => string,
    };
    this.connect();
    this.connectionStatus.subscribe((isConnected) => {
      if (
        !this.reconnectionObservable &&
        typeof isConnected === 'boolean' &&
        !isConnected
      ) {
        this.reconnect();
      }
      if (isConnected) {
        this.reconnectionObservable = null;
      }
    });

    // Construct pong subscriber
    const pong = this.pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter((value: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (value.type === 'pong') {
          return true;
        }
        return false;
      }),
      share(),
    );

    // Do pingpong
    pong
      .pipe(
        startWith('pong'), // to bootstrap the stream
        tap(() => this.connectionStatus.next(true)),
        debounceTime(this.timeout.timeout_interval_ping),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        tap(() => this.send({ command: 'ping' } as any)), // send a ping
        mergeMap(() =>
          timer(this.timeout.timeout_wait_pong).pipe(takeUntil(pong)),
        ),
      ) // wait for pong return true or send next
      .subscribe(() => this.connectionStatus.next(false)); // catch timeout error
  }

  connect(): void {
    this.socket = new WebSocketSubject<IN | OUT[]>(this.wsSubjectConfig);
    this.socket.subscribe(
      (m) => {
        if (m && Array.isArray(m)) {
          for (const r of m) {
            this.next(r);
          }
        }
      },
      (e) => {
        console.error(e);
        // this.reconnect();
      },
    );
  }

  reconnect(): void {
    this.reconnectionObservable = timer(this.reconnectInterval);
    this.reconnectionObservable.subscribe(() => {
      this.connect();
    });
  }

  send(data: IN): void {
    if (this.socket) {
      this.socket.next(data);
    }
  }
}
