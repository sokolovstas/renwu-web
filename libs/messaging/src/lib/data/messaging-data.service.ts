import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
// import { captureException } from '@sentry/browser';
import { RwToastService } from '@renwu/components';
import {
  FileUpload,
  FileWithName,
  Issue,
  Loader,
  RW_CORE_SETTINGS,
  ResponseOk,
  RwCoreSettings,
  RwLoaderService,
} from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import { EMPTY, Observable, Observer, Subject, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Destination,
  DestinationInfo,
  GetMessagesResult,
  Message,
  MessageType,
  PostMessage,
} from './messages.model';
export type DataObject = Record<string, unknown> | Array<unknown> | unknown;
export type ParamsObject = { [param: string]: string | ReadonlyArray<string> };

@Injectable({
  providedIn: 'root',
})
export class RwMessagingDataService {
  headers: { [name: string]: string | string[] };

  unauthHandler: (err: HttpErrorResponse) => void;

  issuesByKeyBuffer: Subject<string>;
  issuesByKeyBufferResult: Subject<Issue[]>;

  issuesByIdBuffer: Subject<string>;
  issuesByIdBufferResult: Subject<Issue[]>;

  constructor(
    private http: HttpClient,
    private toastService: RwToastService,
    private loaderService: RwLoaderService,
    @Inject(RW_CORE_SETTINGS)
    private settings: RwCoreSettings,
  ) {
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  catchHandler(
    err: HttpErrorResponse,
    loader: Loader,
    background: boolean,
  ): Observable<never> {
    if (loader) {
      loader.setProgress(100);
    }
    if (err.status === 401) {
      if (this.unauthHandler) {
        this.unauthHandler(err);
        return throwError(err);
      }
    } else {
      if (!err.url) {
        this.toastService.error($localize`core.no-connection`);
      } else {
        // captureException(err);
        let error = `${err.status} - ${err.url}`;
        if (err.error) {
          try {
            const body = JSONUtils.parse<{ result?: string }>(
              err.error as string,
              {},
            );
            if (body && body.result) {
              // error = `${error} - ${body.result}`;
              error = `${body.result}`;
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
        if (!background) {
          this.toastService.error(error);
        }
      }
      return EMPTY;
    }
    return throwError(err);
  }

  finallyHandler(loader: Loader): void {
    if (loader) {
      loader.setProgress(100);
    }
  }

  sendToMessaging<T>(
    method: 'get' | 'post',
    url: string,
    data: DataObject = null,
  ): Observable<T> {
    const options = {
      headers: new HttpHeaders(this.headers),
      withCredentials: true,
    };

    switch (method) {
      case 'get':
        return this.http.get<T>(this.settings.messagesApiUrl + url, options);

      case 'post':
        return this.http.post<T>(
          this.settings.messagesApiUrl + url,
          data,
          options,
        );
    }
  }

  getVersion(): Observable<string> {
    return this.http.get(`/version.txt?${new Date().getTime()}`, {
      responseType: 'text',
    });
  }

  // MESSAGES
  getLastDestinations(): Observable<DestinationInfo[]> {
    return this.sendToMessaging<{ items: DestinationInfo[] }>(
      'post',
      '/lastdst',
      {},
    ).pipe(map((response) => response.items || []));
  }
  postMessage(message: PostMessage): Observable<{ id: string }> {
    return this.sendToMessaging<{ id: string }>(
      'post',
      '/message/post',
      message,
    );
  }
  updateMessage(
    id: string,
    text: string,
    time: string,
    isExternal: boolean,
  ): Observable<void> {
    return this.sendToMessaging('post', '/message/edit', {
      id: id,
      message: text,
      time: time,
      is_external: isExternal,
    });
  }
  deleteMessage(id: string): Observable<void> {
    return this.sendToMessaging('post', '/message/delete', { id: id });
  }
  getSubDestinations(destination: Destination): Observable<DestinationInfo[]> {
    if (destination.id === 'new') {
      return of(new Array<DestinationInfo>());
    }
    return this.sendToMessaging<{ items: DestinationInfo[] }>(
      'post',
      '/channelthreads',
      { destination },
    ).pipe(map((result) => result.items || []));
  }
  markreadMessages(messageIds: string[]): Observable<void> {
    return this.sendToMessaging('post', '/message/markread', {
      ids: messageIds,
    });
  }
  markreadDestination(
    destination: Destination,
    type: MessageType,
  ): Observable<void> {
    return this.sendToMessaging('post', '/message/markread', {
      destinations: [destination],
      type: type,
    });
  }
  getMessages(
    startMessage: string,
    destination: Destination,
    past: number,
    future: number,
    withChildren: boolean,
    pinned = false,
  ): Observable<GetMessagesResult> {
    if (destination.id === 'new') {
      return of({ items: [], leftBefore: 0, leftAfter: 0 });
    }
    return this.sendToMessaging<GetMessagesResult>('post', '/message/getnext', {
      message_id: startMessage,
      destination: destination,
      past: past,
      future: future,
      with_children: withChildren,
      pinned: pinned,
    }).pipe(tap((response) => (response.items = response.items || [])));
  }

  getMessage(id: string): Observable<Message> {
    return this.sendToMessaging<{ message: Message }>('post', '/message/get', {
      id: id,
    }).pipe(map((response) => response.message || undefined));
  }

  pinMessage(id: string, value: boolean): Observable<Message> {
    return this.sendToMessaging<{ message: Message }>('post', '/message/pin', {
      id: id,
      is_pinned: value,
    }).pipe(map((response) => response.message || undefined));
  }

  favMessage(id: string, value: boolean): Observable<Message> {
    return this.sendToMessaging<{ message: Message }>('post', '/message/fav', {
      id: id,
      is_favorite: value,
    }).pipe(map((response) => response.message || undefined));
  }
  getFavMessages(): Observable<Message[]> {
    return this.sendToMessaging<{ items: Message[] }>(
      'post',
      '/message/getfav',
      {},
    ).pipe(map((response) => response.items || undefined));
  }
  getDestination(id: string): Observable<Destination> {
    return this.sendToMessaging<Destination>('post', '/destination', {
      id,
    }).pipe(map((response) => response));
  }

  // ATTACHMENT ISSUE
  postAttachmentUploadIssue(file: FileWithName): Observable<FileUpload> {
    return this.postUpload(file, '/attachment/upload');
  }

  // ATTACHMENT AVATAR
  postAttachmentUploadAvatar(file: FileWithName): Observable<FileUpload> {
    return this.postUpload(file, '/user/avatar');
  }

  // ATTACHMENT
  postUpload(file: FileWithName, url: string): Observable<FileUpload> {
    const loader: Loader = this.loaderService.setLoader();
    let observerLocal: Observer<FileUpload>;
    let fileOut: FileUpload = {
      file_name: file.fileName || file.file.name,
      __progress: 0,
    } as FileUpload;
    const results = new Observable((observer: Observer<FileUpload>) => {
      observerLocal = observer;
      observerLocal.next(fileOut);
    });
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file.file, file.fileName);
    xhr.open('post', this.settings.rootApiUrl + url, true);
    xhr.withCredentials = true;
    xhr.addEventListener(
      'load',
      (data) => {
        loader.setProgress(100);
        if (xhr.status === 413) {
          fileOut.__error = data;
          observerLocal.error(fileOut);
        } else {
          try {
            fileOut = JSONUtils.parse<FileUpload>(xhr.response as string);
          } catch (e) {
            fileOut.__error = data;
            observerLocal.error(fileOut);
          }
          if (fileOut) {
            fileOut.__progress = 100;
            fileOut.__loaded = true;
            observerLocal.next(fileOut);
          }
        }
      },
      false,
    );
    xhr.upload.addEventListener(
      'progress',
      (data) => {
        if (data.lengthComputable) {
          fileOut.__progress = Math.round((data.loaded * 100) / data.total);
          observerLocal.next(fileOut);
        }
      },
      false,
    );
    xhr.addEventListener(
      'error',
      (error) => {
        loader.setProgress(100);
        fileOut.__error = error;
        observerLocal.error(fileOut);
      },
      false,
    );
    xhr.addEventListener(
      'abort',
      (error) => {
        loader.setProgress(100);
        fileOut.__error = error;
        observerLocal.error(fileOut);
      },
      false,
    );
    xhr.addEventListener(
      'timeout',
      (error) => {
        loader.setProgress(100);
        fileOut.__error = error;
        observerLocal.error(fileOut);
      },
      false,
    );
    xhr.send(formData);
    return results;
  }

  serializeParams(obj: Record<string, DataObject>): string {
    const str: string[] = [];
    for (const p in obj) {
      if (obj?.[p] && Array.isArray(obj[p])) {
        const array: Array<string | { id: string }> = obj[p] as Array<string>;
        if (array.length > 0) {
          if ((array[0] as { id: string })?.id) {
            str.push(
              `${encodeURIComponent(p)}._id=${array
                .map((i) => (i as { id: string }).id)
                .join(',')}`,
            );
          } else {
            str.push(`${encodeURIComponent(p)}=${array.join(',')}`);
          }
        }
      } else if (obj?.[p] && typeof obj[p] === 'object') {
        str.push(
          `${encodeURIComponent(p)}._id=${(obj[p] as { id: string }).id}`,
        );
      } else if (obj?.[p] && typeof obj[p] === 'boolean') {
        str.push(
          `${encodeURIComponent(p)}=${encodeURIComponent(obj[p] as boolean)}`,
        );
      } else if (obj?.[p] && !Array.isArray(obj[p])) {
        str.push(
          `${encodeURIComponent(p)}=${encodeURIComponent(obj[p] as string)}`,
        );
      }
    }
    return str.join('&');
  }
  getWebPushSettings() {
    return this.sendToMessaging<{ web_push_public: string }>(
      'get',
      '/web-push/settings',
    );
  }
  registerWebPushDevice(sub: PushSubscriptionJSON) {
    return this.sendToMessaging<ResponseOk>('post', '/web-push/device', sub);
  }
}
