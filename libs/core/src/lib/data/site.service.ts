import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
// import { captureException } from '@sentry/browser';
import { RwToastService } from '@renwu/components';
import { JSONUtils } from '@renwu/utils';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Loader } from '../loader/loader.service';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';
import { ResponseOk } from './common.model';
import { DataObject, ParamsObject } from './data.service';
import { Instance } from './site.model';

@Injectable({
  providedIn: 'root',
})
export class RwSiteDataService {
  headers: { [name: string]: string | string[] };

  unauthHandler: (err: HttpErrorResponse) => void;

  constructor(
    private http: HttpClient,
    private toastService: RwToastService,
    // private loaderService: RwLoaderService,
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

  // finallyHandler(loader: Loader): void {
  //   if (loader) {
  //     loader.setProgress(100);
  //   }
  // }

  sendToSite<T>(
    method: string,
    url: string,
    data: DataObject | ParamsObject = null,
    background = false,
  ): Observable<T> {
    let loader: Loader;
    // if (!background) {
    //   loader = this.loaderService.setLoader();
    // }
    const options = {
      headers: new HttpHeaders(this.headers),
      withCredentials: true,
      params: new HttpParams(),
    };

    // console.log(this.settings.rootApiUrl + url, data, options);

    switch (method) {
      case 'get':
        options.params = new HttpParams({ fromObject: data as ParamsObject });
        return this.http.get<T>(this.settings.siteApiUrl + url, options).pipe(
          catchError((err: unknown) =>
            this.catchHandler(err as HttpErrorResponse, loader, background),
          ),
          // finalize(() => this.finallyHandler(loader))
        );
      case 'paged':
        options.params = new HttpParams({ fromObject: data as ParamsObject });
        return this.http.get<T>(this.settings.siteApiUrl + url, options).pipe(
          catchError((err: unknown) =>
            this.catchHandler(err as HttpErrorResponse, loader, background),
          ),
          // finalize(() => this.finallyHandler(loader))
        );
      case 'put':
        return this.http
          .put<T>(this.settings.siteApiUrl + url, data, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            // finalize(() => this.finallyHandler(loader))
          );
      case 'post':
        return this.http
          .post<T>(this.settings.siteApiUrl + url, data, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            // finalize(() => this.finallyHandler(loader))
          );
      case 'delete':
        return this.http
          .delete<T>(this.settings.siteApiUrl + url, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            // finalize(() => this.finallyHandler(loader))
          );
    }
    return EMPTY;
  }

  login(username: string, password: string) {
    return this.sendToSite<{ token: string }>('post', `/login`, {
      email: username,
      password: password,
    }).pipe(
      tap((data) => {
        console.log('Login complete', data);
        this.headers = {
          'Renwu-Token': data.token,
        };
      }),
    );
  }

  logout(): Observable<ResponseOk> {
    return this.sendToSite('get', '/logout');
  }

  getInstances() {
    return this.sendToSite<Instance[]>('get', `/profile/instances`);
  }
  changeInstance(id: string) {
    return this.sendToSite<Instance[]>('post', `/profile/instance`, {
      tenantId: id,
    });
  }
}
