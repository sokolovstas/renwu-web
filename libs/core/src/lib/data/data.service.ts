import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
// import { captureException } from '@sentry/browser';
import { TranslocoService } from '@ngneat/transloco';
import { RwToastService } from '@renwu/components';
import { JSONUtils } from '@renwu/utils';
import { EMPTY, Observable, Observer, Subject, throwError } from 'rxjs';
import {
  buffer,
  catchError,
  debounceTime,
  finalize,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { BacklogStat, Container } from '../container/container.model';
import { Milestone } from '../container/milestone.model';
import { TeamBalance, TeamBalanceEntry } from '../container/team-balance.model';
import {
  Attachment,
  Issue,
  IssueChangeEvent,
  IssueChilds,
  IssueElapsedTime,
  IssueExistResponse,
  IssueGroup,
  IssueTodo,
  TimeLog,
} from '../issue/issue.model';
import { Loader, RwLoaderService } from '../loader/loader.service';
import {
  SavedSearchQuery,
  SearchHistory,
  SearchQuery,
  SearchResponse,
} from '../search/search.model';
import { ListOptions, ListOptionsFilters } from '../search/sort.model';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';
import {
  DictionariesDestinations,
  DictionariesTypes,
  HolidayCalendar,
  Priority,
  Status,
  Type,
  Workflow,
  WorkflowTransition,
} from '../settings/dictionary.model';
import { UserSettingsServer } from '../settings/settings.model';
import {
  CurrentUser,
  User,
  UserType,
  UserWorkload,
  UserWorkloadIssues,
} from '../user/user.model';
import { BoardGroupsConfigServer } from './board.model';
import {
  OptionsResponse,
  ResponseOk,
  ResultOK,
  SortData,
  StringResult,
  SystemSettings,
} from './common.model';
import { FileUpload, FileWithName } from './upload';

export type DataObject = Record<string, unknown> | Array<unknown> | unknown;
export type ParamsObject = { [param: string]: string | ReadonlyArray<string> };

@Injectable({
  providedIn: 'root',
})
export class RwDataService {
  transloco = inject(TranslocoService);

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
        this.toastService.error(this.transloco.translate('core.no-connection'));
      } else {
        // captureException(err);
        let error = `${err.status} - ${err.url}`;
        if (err.error) {
          error = `${err.error.message}`;
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

  sendToAPI<T>(
    method: string,
    url: string,
    data: DataObject | ParamsObject = null,
    background = false,
  ): Observable<T> {
    let loader: Loader;
    if (!background) {
      loader = this.loaderService.setLoader();
    }
    const options = {
      headers: new HttpHeaders(this.headers),
      withCredentials: true,
      params: new HttpParams(),
    };

    // console.log(this.settings.rootApiUrl + url, data, options);

    switch (method) {
      case 'get':
        options.params = new HttpParams({ fromObject: data as ParamsObject });
        return this.http.get<T>(this.settings.rootApiUrl + url, options).pipe(
          catchError((err: unknown) =>
            this.catchHandler(err as HttpErrorResponse, loader, background),
          ),
          finalize(() => this.finallyHandler(loader)),
        );
      case 'paged':
        options.params = new HttpParams({ fromObject: data as ParamsObject });
        return this.http.get<T>(this.settings.rootApiUrl + url, options).pipe(
          catchError((err: unknown) =>
            this.catchHandler(err as HttpErrorResponse, loader, background),
          ),
          finalize(() => this.finallyHandler(loader)),
        );
      case 'put':
        return this.http
          .put<T>(this.settings.rootApiUrl + url, data, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            finalize(() => this.finallyHandler(loader)),
          );
      case 'post':
        return this.http
          .post<T>(this.settings.rootApiUrl + url, data, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            finalize(() => this.finallyHandler(loader)),
          );
      case 'delete':
        return this.http
          .delete<T>(this.settings.rootApiUrl + url, options)
          .pipe(
            catchError((err: unknown) =>
              this.catchHandler(err as HttpErrorResponse, loader, background),
            ),
            finalize(() => this.finallyHandler(loader)),
          );
    }
    return EMPTY;
  }

  getVersion(): Observable<string> {
    return this.http.get(`/version.txt?${new Date().getTime()}`, {
      responseType: 'text',
    });
  }

  /// /////////////////////////////////////////////////////
  // CONTAINER
  /// /////////////////////////////////////////////////////

  getContainers(
    filters: Record<string, unknown> = {},
  ): Observable<Container[]> {
    return this.sendToAPI<Container[]>(
      'get',
      `/container?${this.serializeParams(filters)}`,
    );
  }
  getContainer(id: string): Observable<Container> {
    return this.sendToAPI<Container>('get', `/container/${id}`);
  }
  getContainerIssueList(
    id: string,
    filters: ListOptionsFilters,
  ): Observable<Issue[]> {
    return this.sendToAPI<Issue[]>(
      'get',
      `/container/${id}/issues_list?${this.serializeParams(filters as any)}`,
    );
  }
  getContainerIssueTree(
    id: string,
    filters: ListOptionsFilters,
  ): Observable<Issue[]> {
    return this.sendToAPI(
      'get',
      `/container/${id}/issues_tree?${this.serializeParams(filters as any)}`,
    );
  }
  getContainerIssueTreeGrouped(
    id: string,
    group_by: string,
    filters: ListOptionsFilters & { group_by?: string },
  ): Observable<IssueGroup[]> {
    if (group_by !== 'none') {
      filters.group_by = group_by;
    }
    return this.sendToAPI<IssueGroup[]>(
      'get',
      `/container/${id}/issues_tree_grouped?${this.serializeParams(
        filters as any,
      )}`,
    );
  }
  addContainer(container: Container): Observable<Container> {
    return this.sendToAPI('post', '/container', container as DataObject);
  }
  saveContainer(id: string, container: Container): Observable<Container> {
    return this.sendToAPI('put', `/container/${id}`, container as DataObject);
  }
  deleteContainer(id: string): Observable<ResponseOk> {
    return this.sendToAPI('delete', `/container/${id}`);
  }
  testUniqueContainerKey(key: string, id?: string): Observable<boolean> {
    return this.sendToAPI<StringResult>(
      'put',
      `/container/test_unique_key?id=${id || ''}&key=${key}`,
    ).pipe(map((data) => data.result === ResultOK));
  }
  getBacklogStat(id: string): Observable<BacklogStat> {
    return this.sendToAPI('post', '/stat/backlog', { container_id: id });
  }

  // ISSUES

  getIssue(id: string): Observable<Issue> {
    return this.sendToAPI('get', `/issue/${id}`);
  }
  getIssueBackground(id: string): Observable<Issue> {
    return this.sendToAPI('get', `/issue/${id}`, undefined, true);
  }
  private getIssuesByKeyBuffer(): Subject<string> {
    if (!this.issuesByKeyBuffer) {
      const bufferResult = new Subject<Issue[]>();
      const bufferSubject = new Subject<string>();

      this.issuesByKeyBuffer = bufferSubject;
      this.issuesByKeyBufferResult = bufferResult;
      this.issuesByKeyBuffer
        .pipe(
          buffer(bufferSubject.pipe(debounceTime(150))),
          tap(() => {
            this.issuesByKeyBuffer = undefined;
          }),
          map((results) => new Set(results)),
          mergeMap((set: Set<string>) =>
            this.sendToAPI<{ result: Issue[] }>(
              'post',
              '/issues',
              { keys: [...set] },
              true,
            ),
          ),
          map((response: { result: Issue[] }) => response.result),
        )
        .subscribe((issues) => bufferResult.next(issues));
    }
    return this.issuesByKeyBuffer;
  }
  private getIssuesByIdBuffer(): Subject<string> {
    if (!this.issuesByIdBuffer) {
      const bufferResult = new Subject<Issue[]>();
      const bufferSubject = new Subject<string>();

      this.issuesByIdBuffer = bufferSubject;
      this.issuesByIdBufferResult = bufferResult;
      this.issuesByIdBuffer
        .pipe(
          buffer(bufferSubject.pipe(debounceTime(150))),
          tap(() => {
            this.issuesByIdBuffer = undefined;
          }),
          map((results) => {
            return new Set(results);
          }),
          switchMap((set: Set<string>) => {
            return this.sendToAPI<{ result: Issue[] }>(
              'post',
              '/issues',
              { ids: [...set] },
              true,
            );
          }),
          map((response: { result: Issue[] }) => response.result),
        )
        .subscribe((issues) => bufferResult.next(issues));
    }
    return this.issuesByIdBuffer;
  }
  getIssuesByKeyBackgroundBuffered(key: string): Observable<Issue> {
    this.getIssuesByKeyBuffer().next(key);
    return this.issuesByKeyBufferResult.pipe(
      map((issues) => {
        const item = issues.find((i) => i.key === key);
        if (item) {
          return item;
        }
        return null;
      }),
      take(1),
    );
  }
  getIssuesByIDBackgroundBuffered(id: string): Observable<Issue> {
    this.getIssuesByIdBuffer().next(id);
    return this.issuesByIdBufferResult.pipe(
      map((issues) => {
        const item = issues.find((i) => i.id === id);
        if (item) {
          return item;
        }
        return null;
      }),
    );
  }
  getIssueList(filters: ListOptions): Observable<Issue[]> {
    return this.sendToAPI<Issue[]>(
      'get',
      `/issue?query_hash=${filters.hash}&query=${filters.queryString}`,
    );
  }
  getIssueTransitions(id: string): Observable<WorkflowTransition[]> {
    return this.sendToAPI('get', `/issue/${id}/transitions`);
  }
  getChildIssues(id: string): Observable<IssueChilds> {
    return this.sendToAPI('get', `/issue/${id}/childs`);
  }
  addIssue(issue: Issue): Observable<Issue> {
    return this.sendToAPI('post', '/issue', issue as DataObject);
  }
  saveIssue(id: string, issue: Issue): Observable<Issue> {
    return this.sendToAPI('put', `/issue/${id}`, issue as DataObject);
  }
  logIssueTime(id: string, log: TimeLog): Observable<Issue> {
    return this.sendToAPI<Issue>(
      'post',
      `/issue/${id}/logtime`,
      log as DataObject,
    );
  }
  deleteIssue(id: string): Observable<void> {
    return this.sendToAPI('delete', `/issue/${id}`);
  }
  addFavoriteIssue(id: string): Observable<ResponseOk> {
    return this.sendToAPI('put', `/issue/${id}/fav`);
  }
  deleteFavoriteIssue(id: string): Observable<ResponseOk> {
    return this.sendToAPI('delete', `/issue/${id}/fav`);
  }
  changeStatusIssue(id: string, status: Status): Observable<ResponseOk> {
    return this.sendToAPI('post', `/issue/${id}/transit`, status);
  }
  deleteIssueAttachment(
    id: string,
    attachment_id: string,
  ): Observable<ResponseOk> {
    return this.sendToAPI('delete', `/issue/${id}/attachment/${attachment_id}`);
  }
  getIssueExists(id: string): Observable<boolean> {
    return this.sendToAPI<IssueExistResponse>(
      'get',
      `/issue_exists/${id}`,
    ).pipe(map((r) => r.result));
  }
  getIssueElapsedTime(id: string): Observable<IssueElapsedTime> {
    return this.sendToAPI<IssueElapsedTime>(
      'post',
      `/issue/${id}/elapsed_time`,
    );
  }
  addInIssueWatchers(id: string) {
    return this.sendToAPI('put', `/issue/${id}/watch`);
  }
  removeFromIssueWatchers(id: string) {
    return this.sendToAPI('delete', `/issue/${id}/watch`);
  }
  addIssueAttachment(id: string, attachment: Attachment): Observable<Issue> {
    return this.getIssue(id).pipe(
      switchMap((issue) => {
        const saveIssue: Issue = {};
        saveIssue.attachments = JSONUtils.jsonClone<Array<Attachment>>(
          issue.attachments || [],
        );
        saveIssue.attachments.push(attachment);
        return this.saveIssue(id, saveIssue);
      }),
    );
  }

  // SETTINGS

  getIssueStatus(filters: Record<string, unknown>): Observable<Status[]> {
    return this.sendToAPI(
      'get',
      `/dictionary/status?${this.serializeParams(filters)}`,
    );
  }
  getIssueType(filters: Record<string, unknown>): Observable<Type[]> {
    return this.sendToAPI(
      'get',
      `/dictionary/type?${this.serializeParams(filters)}`,
    );
  }
  getIssuePriority(filters: Record<string, unknown>): Observable<Priority[]> {
    return this.sendToAPI(
      'get',
      `/dictionary/priority?${this.serializeParams(filters)}`,
    );
  }

  // MILESTONES

  getMilestones(
    containerId?: string,
    archived?: boolean,
  ): Observable<Milestone[]> {
    if (containerId) {
      return this.sendToAPI<Milestone[]>(
        'get',
        `/container/${containerId}/milestone`,
        archived !== undefined ? { archived: archived } : {},
      );
    }
    return this.sendToAPI<Milestone[]>(
      'get',
      `/milestone`,
      archived !== undefined ? { archived: archived } : {},
    );
  }
  getMilestone(id: string): Observable<Milestone> {
    return this.sendToAPI('get', `/milestone/${id}`);
  }
  addMilestone(
    containerId: string,
    milestone: Milestone,
  ): Observable<Milestone> {
    return this.sendToAPI(
      'post',
      `/container/${containerId}/milestone`,
      milestone,
    );
  }
  saveMilestone(id: string, milestone: Milestone): Observable<Milestone> {
    return this.sendToAPI('put', `/milestone/${id}`, milestone);
  }
  deleteMilestone(id: string): Observable<void> {
    return this.sendToAPI('delete', `/milestone/${id}`);
  }
  archiveMilestone(milestoneId: string): Observable<boolean> {
    return this.sendToAPI<ResponseOk>(
      'post',
      `/milestone/${milestoneId}/archive`,
    ).pipe(map((r) => r.result === ResultOK));
  }
  unarchiveMilestone(milestoneId: string): Observable<boolean> {
    return this.sendToAPI<ResponseOk>(
      'post',
      `/milestone/${milestoneId}/unarchive`,
    ).pipe(map((r) => r.result === ResultOK));
  }
  sortMilestones(containerId: string, sort: SortData): Observable<ResponseOk> {
    return this.sendToAPI(
      'post',
      `/container/${containerId}/milestone/set_sort`,
      sort,
    );
  }
  getMilestoneIssuesList(id: string): Observable<Issue[]> {
    return this.sendToAPI('get', `/milestone/${id}/issues`);
  }
  getMilestoneActiveList(id: string): Observable<Issue[]> {
    return this.sendToAPI<Issue[]>('get', `/milestone/${id}/active_issues`);
  }

  // USERS

  getCurrentUser(): Observable<CurrentUser> {
    return this.sendToAPI('get', '/user/current');
  }
  getUserWorkload(
    id: string,
    filters: ListOptionsFilters,
  ): Observable<UserWorkload> {
    return this.sendToAPI(
      'get',
      `/user/${id}/workload?${this.serializeParams(filters as any)}`,
    );
  }
  getUserWorkloadIssues(
    id: string,
    filters: ListOptionsFilters,
  ): Observable<UserWorkloadIssues> {
    return this.sendToAPI(
      'get',
      `/user/${id}/workload_issues?${this.serializeParams(filters as any)}`,
    );
  }

  getUsers(filters: {
    type?: UserType[];
    showDeleted?: boolean;
  }): Observable<User[]> {
    return this.sendToAPI(
      'get',
      `/user?${this.serializeParams(filters as any)}`,
    );
  }
  getUser(id: string): Observable<User> {
    return this.sendToAPI('get', `/user/${id}`);
  }
  getUserByUsername(username: string): Observable<User> {
    return this.sendToAPI('get', `/user_by_name/${username}`);
  }
  addUser(user: User): Observable<User> {
    return this.sendToAPI('post', '/user', user);
  }
  saveUser(id: string, user: User): Observable<User> {
    return this.sendToAPI<User>('put', `/user/${id}`, user);
  }
  deleteUser(id: string): Observable<ResponseOk> {
    return this.sendToAPI('delete', `/user/${id}`);
  }
  getUserTasks(
    filterName: 'reported' | 'recent' | 'watcher' | 'fav' | 'todo',
    id?: string,
  ): Observable<Issue[]> {
    if (id) {
      return this.sendToAPI<Issue[]>('get', `/user/${id}/issues/${filterName}`);
    }
    return this.sendToAPI<Issue[]>('get', `/user/issues/${filterName}`);
  }
  inviteNewUser(user: User): Observable<User> {
    return this.sendToAPI('post', '/user/invite', user);
  }
  inviteOldUser(id: string, user: User): Observable<User> {
    return this.sendToAPI('put', `/user/${id}/invite`, user);
  }
  getUserLastActivity(id?: string): Observable<IssueChangeEvent[]> {
    if (id) {
      return this.sendToAPI<IssueChangeEvent[]>(
        'get',
        `/user/${id}/last_activity`,
      );
    }
    return this.sendToAPI<IssueChangeEvent[]>('get', '/user/last_activity');
  }
  getUserSettings(id: string): Observable<UserSettingsServer> {
    return this.sendToAPI('get', `/user/${id || 'current'}/settings`);
  }
  saveUserSettings(
    id: string,
    settings: UserSettingsServer,
  ): Observable<UserSettingsServer> {
    return this.sendToAPI(
      'post',
      `/user/${id || 'current'}/settings`,
      settings,
    );
  }
  checkUser(user: {
    id?: string;
    username?: string;
    email?: string;
  }): Observable<StringResult> {
    return this.sendToAPI(
      'post',
      `/user/check_user?${this.serializeParams(user)}`,
    );
  }
  getInviteToken(id: string): Observable<{ invite_token: string }> {
    return this.sendToAPI('get', `/user/${id}/invite_token`);
  }
  restoreUser(id: string): Observable<ResponseOk> {
    return this.sendToAPI('post', `/user/${id}/restore`);
  }

  getTeamBalance(id: string): Observable<TeamBalanceEntry[]> {
    return this.sendToAPI<{ result: TeamBalance }>(
      'get',
      `/user/${id}/team_balance`,
    ).pipe(map((data) => data.result));
  }
  saveTeamBalance(id: string, data: TeamBalance): Observable<ResponseOk> {
    return this.sendToAPI('post', `/user/${id}/team_balance`, data);
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
  postAttachmentDelete(attachment: Attachment): Observable<ResponseOk> {
    return this.sendToAPI<ResponseOk>('post', '/attachment/delete', attachment);
  }
  postAttachmentUpdate(attachment: Attachment): Observable<Attachment> {
    return this.sendToAPI<Attachment>('post', '/attachment/upload', attachment);
  }

  // HOLIDAYS
  getHolidayCalendarList(): Observable<HolidayCalendar[]> {
    return this.sendToAPI<HolidayCalendar[]>('get', '/holidays');
  }
  getHolidayCalendar(id: string): Observable<HolidayCalendar> {
    return this.sendToAPI<HolidayCalendar>('get', `/holidays/${id}`);
  }
  addHolidayCalendar(
    daysHoliday: HolidayCalendar,
  ): Observable<HolidayCalendar> {
    return this.sendToAPI<HolidayCalendar>('post', '/holidays', daysHoliday);
  }
  setHolidayCalendar(
    id: string,
    daysHoliday: HolidayCalendar,
  ): Observable<HolidayCalendar> {
    return this.sendToAPI('put', `/holidays/${id}`, daysHoliday);
  }
  deleteHolidayGraph(id: string): Observable<void> {
    return this.sendToAPI<void>('delete', `/holidays/${id}`);
  }

  // DICTIONARIES
  getDictionaryOptions<T extends DictionariesTypes>(
    destination: DictionariesDestinations,
    id: string | number = '',
    requestFilters: Record<string, unknown> = {},
    page = 1,
  ): Observable<OptionsResponse<T>> {
    return this.sendToAPI<OptionsResponse<T>>(
      'paged',
      `/${destination.replace(
        ':id',
        id.toString(),
      )}?format=options&page=${page}&${this.serializeParams(requestFilters)}`,
    ).pipe(
      map((r) => ({
        results: (r.results || r) as T[],
        next: r.next,
        count: r.count,
        previous: r.previous,
      })),
    );
  }

  getDictionary<T>(name: string): Observable<T[]> {
    return this.sendToAPI<T[]>('paged', `/${name}`).pipe(
      map((array) => array || []),
    );
  }

  saveDictionary<T>(name: string, dict: T[]): Observable<T[]> {
    return this.sendToAPI('post', `/${name}`, dict);
  }

  // WORKFLOWS

  getWorkflows(): Observable<Workflow[]> {
    return this.sendToAPI<{ _id: string; data: Workflow[] }>(
      'get',
      '/settings/workflow',
    ).pipe(map((value) => value.data || []));
  }
  getWorkflow(id: string): Observable<Workflow> {
    return this.sendToAPI<Workflow>('get', `/settings/workflow/${id}`);
  }
  saveWorkflow(id: string, workflow: Workflow): Observable<ResponseOk> {
    return this.sendToAPI<ResponseOk>(
      'post',
      `/settings/workflow/${id}`,
      workflow,
    );
  }

  // BOARDS

  getBoards(): Observable<BoardGroupsConfigServer[]> {
    return this.sendToAPI<BoardGroupsConfigServer[]>('get', '/board');
  }
  saveBoard(
    board: BoardGroupsConfigServer,
  ): Observable<BoardGroupsConfigServer> {
    return this.sendToAPI<BoardGroupsConfigServer>(
      'put',
      `/board/${board.id}`,
      board,
    );
  }
  addBoard(
    board: BoardGroupsConfigServer,
  ): Observable<BoardGroupsConfigServer> {
    return this.sendToAPI<BoardGroupsConfigServer>('post', '/board', board);
  }
  deleteBoard(id: string): Observable<ResponseOk> {
    return this.sendToAPI<ResponseOk>('delete', `/board/${id}`);
  }

  // BOARDS

  getPersonalTodos(): Observable<IssueTodo[]> {
    return this.sendToAPI<IssueTodo[]>('get', '/user/personal_todo');
  }
  savePersonalTodos(todos: IssueTodo[]): Observable<IssueTodo[]> {
    return this.sendToAPI<IssueTodo[]>('post', '/user/personal_todo', todos);
  }

  // SETTINGS

  getSettings(id: 'system'): Observable<SystemSettings>;
  getSettings(id: string): Observable<unknown> {
    return this.sendToAPI('get', `/settings/${id}`);
  }
  saveSettings(
    id: 'system',
    settings: SystemSettings,
  ): Observable<SystemSettings>;
  saveSettings(id: string, settings: unknown): Observable<unknown> {
    return this.sendToAPI('post', `/settings/${id}`, settings);
  }

  // Events
  getIssueEvents(id: string): Observable<IssueChangeEvent[]> {
    return this.sendToAPI<IssueChangeEvent[]>('get', `/issue/${id}/events`);
  }

  // JIRA

  // jiraLoadSetting(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/settings');
  // }
  // jiraSaveSetting(data: any): Observable<any> {
  //   return this.sendToAPI('post', '/jira/settings', data);
  // }

  // jiraTestConnection(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/test');
  // }
  // jiraCheckJQL(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/check_jql');
  // }
  // jiraImportJQL(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/import_jql');
  // }
  // jiraCheckOQL(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/check_oql');
  // }
  // jiraUpdateDictionaries(): Observable<any> {
  //   return this.sendToAPI('get', '/jira/update_dictionaries');
  // }

  // Search

  quickSearch(queryString: string): Observable<SearchResponse> {
    queryString = (queryString || '').trim();
    // let query = '';
    // query += `keys:"${queryString}"^5 key:"${queryString}"^5`;
    // const subQuery = 'title:$r description:$r comments.message:$r todos.description:$r';
    // for (const word of queryString.split(' ')) {
    //   query += ' ' + subQuery.replace(/\$r/g, word);
    // }

    return this.sendToAPI<SearchResponse>(
      'get',
      `/search/quick?q=${queryString}`,
      '',
      true,
    ).pipe(
      tap((response) => {
        response.issues = response.issues || [];
        response.hits = response.hits || [];
        response.issues.forEach((issue, index) => {
          issue.__score = response.hits[index].score;
        });
        response.issues.sort((a, b) => b.__score - a.__score);
        if (response.issues.length > 10) {
          response.issues = response.issues.slice(0, 10);
        }
      }),
    );
  }

  advancedSearch(query: SearchQuery): Observable<SearchResponse> {
    return this.sendToAPI<SearchResponse>(
      'post',
      '/search/advanced',
      query,
    ).pipe(
      map((response) => {
        response.hits = response.hits || [];
        response.issues = response.issues || [];
        return response;
      }),
    );
  }

  searchHistory(): Observable<SearchHistory[]> {
    return this.sendToAPI<SearchHistory[]>('get', '/search/history', '', true);
  }

  getSearchQueries(): Observable<SavedSearchQuery[]> {
    return this.sendToAPI<SavedSearchQuery[]>('get', '/search/query', '', true);
  }

  getSearchQuery(id: string): Observable<SavedSearchQuery> {
    return this.sendToAPI<SavedSearchQuery>(
      'get',
      `/search/query/${id}`,
      '',
      true,
    );
  }

  addSearchQuery(query: SavedSearchQuery): Observable<SavedSearchQuery> {
    return this.sendToAPI<SavedSearchQuery>(
      'post',
      '/search/query',
      query,
      true,
    );
  }

  saveSearchQuery(
    id: string,
    query: SavedSearchQuery,
  ): Observable<SavedSearchQuery> {
    return this.sendToAPI<SavedSearchQuery>(
      'put',
      `/search/query/${id}`,
      query,
      true,
    );
  }

  deleteSearchQuery(id: string): Observable<ResponseOk> {
    return this.sendToAPI<ResponseOk>(
      'delete',
      `/search/query/${id}`,
      '',
      true,
    );
  }

  // UTILS

  serializeParams(obj: Record<string, DataObject>): string {
    const str: string[] = [];
    for (const p in obj) {
      if (obj?.[p] !== undefined && Array.isArray(obj[p])) {
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
      } else if (obj?.[p] !== undefined && typeof obj[p] === 'object') {
        str.push(
          `${encodeURIComponent(p)}._id=${(obj[p] as { id: string }).id}`,
        );
      } else if (obj?.[p] !== undefined && typeof obj[p] === 'boolean') {
        str.push(
          `${encodeURIComponent(p)}=${encodeURIComponent(obj[p] as boolean)}`,
        );
      } else if (obj?.[p] !== undefined && !Array.isArray(obj[p])) {
        str.push(
          `${encodeURIComponent(p)}=${encodeURIComponent(obj[p] as string)}`,
        );
      }
    }
    return str.join('&');
  }
}
