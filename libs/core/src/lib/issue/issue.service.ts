import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { RwAlertService, RwToastService } from '@renwu/components';
import { getUnixTime, parseISO } from 'date-fns';
import {
  BehaviorSubject,
  Subject,
  firstValueFrom,
  from,
  merge,
  of,
  throwError,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  map,
  repeat,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
// import { TimelogComponent } from 'projects/core/src/lib/issue/timelog/timelog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { JSONUtils } from '@renwu/utils';
import { ContainerD } from '../container/container.model';
import { RwContainerService } from '../container/container.service';
import { MilestoneD } from '../container/milestone.model';
import { RwDataService } from '../data/data.service';
import {
  Priority,
  Status,
  Type,
  WorkflowTransition,
} from '../settings/dictionary.model';
import { UserD } from '../user/user.model';
import { RwUserService } from '../user/user.service';
import { RwWebsocketService } from '../websocket/websocket.service';
import { Issue } from './issue.model';

@Injectable({ providedIn: 'root' })
export class RwIssueService implements OnDestroy {
  private readonly transloco = inject(TranslocoService);
  private readonly dataService = inject(RwDataService);
  private readonly toastService = inject(RwToastService);
  private readonly userService = inject(RwUserService);
  private readonly alertService = inject(RwAlertService);
  private readonly containerService = inject(RwContainerService);
  private readonly destroy = inject(DestroyRef);
  private readonly websocketService = inject(RwWebsocketService);

  public key = new Subject<string>();

  issueStorage: Issue;

  issueForm = new FormGroup({
    id: new FormControl(''),
    todos: new FormArray<
      FormGroup<{
        is_done: FormControl<boolean>;
        description: FormControl<string>;
      }>
    >([]),
    fav_users: new FormControl<string[]>([]),
    key: new FormControl(''),
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    container: new FormControl<ContainerD>(null, {
      validators: [Validators.required],
    }),
    milestones: new FormControl<MilestoneD[]>(null),
    type: new FormControl<Type>(null),
    priority: new FormControl<Priority>(null),
    status: new FormControl<Status>(null),
    labels: new FormControl<string[]>([]),
    // skill: new FormControl<string>(null),
    affected_versions: new FormControl<MilestoneD[]>(null),
    assignes: new FormControl<UserD[]>([]),
    watchers: new FormControl<UserD[]>([]),
    description: new FormControl(''),
    estimated_time: new FormControl(4 * 60 * 60, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  private template = new Subject<Issue>();

  private issueInt = this.key.pipe(
    switchMap((key) =>
      merge(
        from(this.initIssue({ key })),
        this.template.pipe(
          switchMap((t) => from(this.initIssue({ ...t, key }))),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  refresher = this.issueInt.pipe(
    switchMap((task) => this.websocketService.onIssueEvent([task.id])),
    filter((e) => e.type !== 'issue_delete'),
  );

  issue = this.issueInt.pipe(
    debounceTime(100),
    tap((t) => {
      this.patchIssue(t, { reset: true });
      this.setPrevState();
    }),
    tap((t) => {
      this.websocketService.clearId('issuedetail');
      this.websocketService.pushId('issuedetail', t.id);
      this.websocketService.sendView();
    }),
    takeUntil(this.refresher),
    repeat(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  favorite = merge(
    this.issue,
    this.issueForm.valueChanges.pipe(map(() => this.issueForm.getRawValue())),
  ).pipe(map((t) => t.fav_users?.includes(this.userService.getId())));

  newIssue = this.issue.pipe(map((p) => p.id === 'new'));

  prevValue = new BehaviorSubject<Issue>(this.issueForm.getRawValue());

  transitions = this.prevValue.pipe(
    filter((t) => !!t?.id),
    switchMap((t) =>
      t.id === 'new'
        ? of([] as WorkflowTransition[])
        : this.dataService.getIssueTransitions(t.id),
    ),
  );

  constructor() {
    this.issueForm.valueChanges
      .pipe(
        map(() => this.issueForm.getRawValue()),
        filter((v) => !!v?.key),
        map((v) => JSONUtils.jsonClone(v)),
        filter((newValue) => this.prevValue.getValue().id === newValue.id),
        switchMap((newValue) => {
          return this.save(this.prevValue.getValue(), newValue);
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe();

    this.issueForm.valueChanges
      .pipe(
        map((v) => JSONUtils.jsonClone(v)),
        filter((newValue) => newValue.id === 'new'),
        tap(async (newValue) => {
          if (
            newValue?.container?.id &&
            this.prevValue.getValue()?.container?.id !== newValue?.container?.id
          ) {
            const template = await this.containerService.getIssueTemplate(
              newValue?.container?.id,
            );
            this.patchIssue(template);
            this.setPrevState();
          }
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.websocketService.clearId('issuedetail');
  }

  updateFromTemplate(issue: Issue) {
    this.template.next(issue);
  }

  async initIssue(issue: Issue) {
    if (issue.key === 'new' || !issue.key) {
      issue.id = 'new';
      issue.key = 'new';
    }
    if (issue.id === 'new') {
      let issueTemplate = {};
      if (issue.container) {
        issueTemplate = await this.containerService.getIssueTemplate(
          issue.container.id,
        );
      }

      if (issueTemplate) {
        issue = { ...issue, ...issueTemplate };
      }
      if (!issue.assignes) {
        issue.assignes = [];
      }
      if (!issue.estimated_time || issue.estimated_time === 0) {
        issue.estimated_time = 4 * 60 * 60;
      }
      if (!issue.links) {
        issue.links = {
          parent: [],
          next_issue: [],
          prev_issue: [],
        };
      }
      issue.title = issue.title || '';
      issue.attachments = [];
      issue.assignes_calc = [];
      issue.watchers = [];
      issue.completion = 0;
      return JSONUtils.jsonClone(issue);
    } else {
      issue = { id: issue.id, key: issue.key };
      return firstValueFrom(this.loadIssue(issue));
    }
  }
  createAnother(issue: Issue) {
    const another = JSONUtils.jsonClone(issue);
    another.id = 'new';
    another.title = '';
    another.key = null;
    another.keys = null;
    another.description = '';
    another.watchers = null;
    another.attachments = null;
    another.fav_users = [];
    another.todos = [];
    if (another.links) {
      if (another.links.related) {
        another.links.related = [];
      }
      if (another.links.prev_issue) {
        another.links.prev_issue = [];
      }
      if (another.links.next_issue) {
        another.links.next_issue = [];
      }
    }
    return another;
  }
  loadIssue(issue: Issue) {
    return this.dataService.getIssue(issue.key || issue.id);
  }
  create() {
    const issue = this.issueForm.getRawValue();
    if (issue.id !== 'new') {
      return throwError(() => null);
    }
    issue.id = null;
    issue.key = null;
    return this.dataService.addIssue(issue).pipe(
      switchMap((data) => {
        // if (issue.favorite) {
        //   return this.setFavorite(true).pipe(map(() => data));
        // }
        return of(data);
      }),
      tap(() => {
        this.patchIssue(this.createAnother(issue));
      }),
    );
  }
  save(issuePrev: Issue, issue: Issue) {
    if (issue?.id === 'new' || !issue?.id) {
      return of(null);
    }
    const diff = this.getDiff(issuePrev, issue);

    // Skip status on save
    if (issuePrev.status.id !== issue.status.id) {
      delete diff.status;
      return this.transitIssue(issuePrev.status, issue.status);
    }

    if (this.diffNotEmpty(diff)) {
      return this.dataService.saveIssue(String(issue.id), diff).pipe(
        // transit issue
        catchError(() => {
          this.toastService.error(
            this.transloco.translate('core.failed-to-save-issue'),
          );
          return of(issuePrev);
        }),
        map(() => {
          this.toastService.success(
            this.transloco.translate('core.issue-saved-successfully'),
          );
          return this.setPrevState();
        }),
      );
    }
    return of(issue);
  }
  delete() {
    const issue = this.issueForm.getRawValue();
    return this.alertService
      .confirm(
        this.transloco.translate('core.delete-%issue.key%?'),
        this.transloco.translate(
          'core.are-you-sure-you-want-to-delete-task-"%issue.key%"?',
        ),
        true,
        this.transloco.translate('core.delete'),
        this.transloco.translate('core.cancel'),
      )
      .pipe(
        switchMap((data) => {
          if (data && data.affirmative) {
            return this.dataService.deleteIssue(issue.id).pipe(map(() => true));
          }
          return of(false);
        }),
      );
  }
  getDiff(issuePrev: Issue, issue: Issue): Partial<Issue> {
    const result: any = {};
    if (!issuePrev) {
      return result;
    }

    for (const k of Object.keys(issue)) {
      const issueKey = k as keyof Issue;
      if (k === 'title' && (!issue[k] || issue[k].trim().length === 0)) {
        continue;
      }
      if (k === 'date_last_update') {
        continue;
      }
      if (k === 'version') {
        continue;
      }

      let notEqual = !JSONUtils.jsonCompare(
        issuePrev[issueKey],
        issue[issueKey],
      );
      if (
        notEqual &&
        ((issuePrev[issueKey] === null && issue[issueKey] === undefined) ||
          (issuePrev[issueKey] === undefined && issue[issueKey] === null))
      ) {
        notEqual = false;
      }
      if (notEqual) {
        result[issueKey] = issue[issueKey];
      }
    }
    return result;
  }
  diffNotEmpty(diff: Partial<Issue>) {
    return Object.keys(diff).length > 0;
  }
  setFavorite(value: boolean) {
    const favUsers = this.issueForm.getRawValue().fav_users;
    if (value) {
      favUsers.push(this.userService.getId());
      return this.dataService
        .addFavoriteIssue(this.issueForm.getRawValue().id)
        .pipe(
          tap(() =>
            this.issueForm.patchValue({
              fav_users: favUsers,
            }),
          ),
        );
    } else {
      favUsers.splice(favUsers.indexOf(this.userService.getId()), 1);
      return this.dataService
        .deleteFavoriteIssue(this.issueForm.getRawValue().id)
        .pipe(tap(() => this.issueForm.patchValue({ fav_users: favUsers })));
    }
  }
  // toggleTimeLogger(issue: Issue, newStatus?: Status): Observable<boolean> {
  //   return of(true);
  //   const timelog: TimelogComponent = this.modalService.add(
  //     TimelogComponent,
  //     { issue: issue, newStatus: newStatus },
  //   );
  //   timelog.completed.subscribe((changed) => {
  //     if (changed) {
  //       this.onSave();
  //       if (newStatus) {
  //         this.onPostTimeHandler(issue, newStatus);
  //       } else {
  //         this.loadIssue(issue);
  //       }
  //       this.modalService.close();
  //       observer.next(true);
  //     }
  //   });
  // }
  // onPostTimeHandler(issue: Issue, newStatus: Status) {
  //   this.dataService
  //     .changeStatusIssue(issue.id, newStatus)
  //     .subscribe((data) => {
  //       this.loadIssue(issue);
  //       // this.onSave();
  //     });
  // }
  changeIssueStatus(from: Status, to: Status) {
    this.patchIssue({ status: to }, { emitEvent: true });
  }
  transitIssue(from: Status, to: Status) {
    const issueInput = this.issueForm.getRawValue();
    return this.dataService.getIssue(issueInput.key || issueInput.id).pipe(
      switchMap((issue) => {
        if (to.completed && !issue.status.completed && issue.todos) {
          for (let i = 0; i < issue.todos.length; ++i) {
            if (!issue.todos[i].is_done) {
              return this.alertService
                .alert(
                  this.transloco.translate(
                    'core.you-can-not-completed-this-issue',
                  ),
                  this.transloco.translate('core.make-all-todo'),
                )
                .pipe(map(() => null));
            }
          }
        }
        if (to.log_time && !issue.have_childs) {
          return of(issue);
          // this.toggleTimeLogger(issue, to).subscribe(() => {
          //   issueInput.status = to;
          //   if (this.originalIssue) {
          //     this.originalIssue.status = to;
          //   }
          //   observer.next(true);
          // });
        }
        return of(issue);
        // else if (
        //   !issue.have_childs &&
        //   ((issue.status.completed && !to.completed) ||
        //     (issue.status.in_progress && !to.in_progress))
        // ) {
        // const timelog: TimelogComponent = this.modalService.add(
        //   TimelogComponent,
        //   { issue: issue, to: to }
        // );
        // timelog.completed.subscribe((changed) => {
        //   if (changed) {
        //     issueInput.status = to;
        //     if (this.originalIssue) {
        //       this.originalIssue.status = to;
        //     }
        //     this.onSave();
        //     this.onPostTimeHandler(issue, to);
        //     this.modalService.close();
        //   }
        //   observer.next(true);
        // });
        // } else {
        // issueInput.status = to;
        // if (this.originalIssue) {
        //   this.originalIssue.status = to;
        // }
        // this.onPostTimeHandler(issue, to);
        // observer.next(true);
        // }
      }),
      switchMap((issue) => {
        if (issue) {
          return this.dataService.changeStatusIssue(String(issue.id), to).pipe(
            catchError(() => {
              this.toastService.error(
                this.transloco.translate('core.failed-to-save-issue'),
              );
              this.patchIssue({ status: from });
              return of(issueInput);
            }),
            tap(() => {
              this.toastService.success(
                this.transloco.translate('core.issue-saved-successfully'),
              );
              this.patchIssue({ status: to });
              this.setPrevState();
            }),
          );
        }
        this.patchIssue({ status: from });
        this.setPrevState();
        return of(null);
      }),
    );
  }
  getFlags(issue: Issue, isGroup?: boolean): IssueFlags {
    const flags: IssueFlags = {
      manual: false,
      notPlanning: false,
      notPosted: false,
      canDrag: false,
      canDragManual: false,
      offset: false,
      noAssignee: false,
    };
    const flagNotPosted =
      !issue.date_start && !issue.date_start_calc && !isGroup;

    flags.manual = !issue.auto_scheduling; // ||
    // !this.containerService.currentContainer.auto_scheduling;

    flags.notPlanning =
      !flags.manual && flagNotPosted && issue.status && !issue.status.rebot;
    flags.notPosted = flags.manual && flagNotPosted;
    flags.canDrag =
      !flags.notPosted &&
      !issue.have_childs &&
      (!!issue.date_start || !!issue.date_start_calc);
    flags.canDragManual = flags.canDrag && flags.manual;
    flags.offset =
      !issue.auto_scheduling &&
      issue.date_start_calc &&
      issue.date_start &&
      getUnixTime(parseISO(issue.date_start_calc)) <
        getUnixTime(parseISO(issue.date_start));
    flags.noAssignee =
      !flags.manual &&
      (!issue.assignes_calc || !issue.assignes_calc.length) &&
      (!issue.assignes || !issue.assignes.length) &&
      !issue.have_childs &&
      !isGroup;
    return flags;
  }
  setPrevState() {
    this.prevValue.next(this.issueForm.getRawValue());
  }
  patchIssue(
    issue: Issue,
    params: { emitEvent?: boolean; reset?: boolean } = {
      emitEvent: false,
      reset: false,
    },
  ) {
    const fb = new FormBuilder();
    if (params.reset) {
      issue.todos = issue.todos || [];
      this.issueForm.reset(issue, { emitEvent: params.emitEvent });
    } else {
      this.issueForm.patchValue(issue, { emitEvent: params.emitEvent });
    }
    if (issue.todos) {
      this.issueForm.controls.todos.clear();
      for (const v of issue.todos) {
        this.issueForm.controls.todos.push(
          fb.group({
            is_done: fb.control(v.is_done),
            description: fb.control(v.description),
          }),
        );
      }
    }
  }
}
export interface IssueFlags {
  manual: boolean;
  notPlanning: boolean;
  notPosted: boolean;
  canDrag: boolean;
  canDragManual: boolean;
  offset: boolean;
  noAssignee: boolean;
}
