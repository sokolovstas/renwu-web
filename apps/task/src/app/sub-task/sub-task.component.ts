import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwModalService,
  RwToastService,
} from '@renwu/components';
import { Router } from '@angular/router';
import {
  Issue,
  IssueChilds,
  IssueHrefComponent,
  IssueLinks,
  IssueStatusComponent,
  IssuesStatusBarComponent,
  RwDataService,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import {
  catchError,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { IssueLinkSearchInputComponent } from '../issue-links/issue-link-search-input.component';
import { parentIssueToLink } from './parent-issue-to-link';
import { TaskDecompositeModalComponent } from './task-decomposite-modal.component';

@Component({
  selector: 'renwu-task-sub-task',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    IssueHrefComponent,
    IssueStatusComponent,
    IssuesStatusBarComponent,
    IssueLinkSearchInputComponent,
    RwButtonComponent,
  ],
  template: `
    @let isNew = isNewIssue | async;
    @let canEdit = canEdit$ | async;
    @let pending = pendingSubtasks$ | async;
    <div class="mt-4 mx-2">
      <div
        class="font-extralight text-2xl mb-2 flex flex-row flex-wrap items-center justify-between gap-2"
        >
        <span>{{ 'task.subtask' | transloco }}</span>
        @if (isNew === false && canEdit) {
          <div class="flex flex-row gap-1 shrink-0">
            <rw-button
              class="opacity-70 hover:opacity-100"
              typeButton="icon"
              iconClass="add-bold"
              [title]="'task.subtask-add' | transloco"
              (clicked)="addChild()"
            />
            <rw-button
              class="opacity-70 hover:opacity-100"
              typeButton="icon"
              iconClass="list"
              [title]="'task.subtask-decomposite' | transloco"
              (clicked)="openDecomposite()"
            />
          </div>
        }
      </div>
      @if (isNew) {
        @if (pending?.length) {
          <div class="flex flex-col gap-1 px-1">
            @for (c of pending; track c.id) {
              <div class="flex flex-row items-center justify-between gap-2 text-sm">
                <renwu-issue-href
                  [issue]="c"
                  [key]="c.key"
                  [title]="c.title"
                  [linkButton]="true"
                />
                <rw-button
                  class="opacity-40 hover:opacity-100"
                  typeButton="icon"
                  iconClass="trash"
                  (clicked)="removePendingSubtask(c.id)"
                />
              </div>
            }
          </div>
        } @else {
          <p class="text-sm opacity-70 mb-2">{{ 'task.subtask-save-first' | transloco }}</p>
        }
      }
      @if (isNew === false) {
        @if (childData$ | async; as data) {
          @if (data.childs.length > 0) {
            <renwu-issue-status-bar [childs]="data" />
          }
          @if (hasProgress(data)) {
            <div class="text-sm opacity-80 mb-2 px-1">
              {{
                'task.subtask-progress'
                  | transloco
                    : {
                        resolved: data.childs_resolved,
                        total: data.childs_total,
                      }
              }}
            </div>
          }
          <div class="flex flex-col gap-1 px-1">
            @for (c of data.childs; track c.id) {
              <div class="flex flex-row items-center justify-between gap-2 text-sm">
                <renwu-issue-href
                  [issue]="c"
                  [key]="c.key"
                  [title]="c.title"
                  [linkButton]="true"
                />
                <div class="flex flex-row items-center gap-2 shrink-0">
                  @if (c.status) {
                    <renwu-issue-status [value]="c.status" />
                  }
                  @if (canEdit) {
                    <rw-button
                      class="opacity-40 hover:opacity-100"
                      typeButton="icon"
                      iconClass="trash"
                      [double]="true"
                      (clicked)="unlinkChild(c)"
                    />
                  }
                </div>
              </div>
            }
          </div>
          @if (canEdit) {
            <div class="flex flex-row items-center gap-2 flex-1 min-w-0 mt-2 px-1">
              <renwu-task-issue-link-search-input
                class="max-w-xs w-full flex-1 subtask-search-input"
                [promptKey]="'task.subtask-add-placeholder'"
                [selfKey]="issueService.issueForm.getRawValue().key ?? null"
                [forbiddenKeys]="childKeys$ | async"
                (issuePicked)="linkChild($event)"
              />
            </div>
          }
        }
      }
    </div>
  `,
  styleUrl: './sub-task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubTaskComponent {
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);
  policyService = inject(RwPolicyService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  router = inject(Router);
  modalService = inject(RwModalService);

  private readonly reloadChilds$ = new Subject<void>();

  private readonly emptyChilds: IssueChilds = {
    childs: [],
    childs_completed_total: 0,
    childs_estimated_total: 0,
    childs_resolved: 0,
    childs_total: 0,
  };

  isNewIssue = this.issueService.newIssue;
  pendingSubtasks$ = this.issueService.pendingSubtasks;

  canEdit$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.valueChanges.pipe(
      startWith(this.issueService.issueForm.value),
    ),
  ).pipe(
    map(() => {
      const v = this.issueService.issueForm.getRawValue();
      const id = !v.id || v.id === 'new' ? 'new' : String(v.id);
      const cid = v.container?.id ? String(v.container.id) : '';
      return { id, cid };
    }),
    distinctUntilChanged((a, b) => a.id === b.id && a.cid === b.cid),
    switchMap(({ id, cid }) => this.policyService.canEditIssue(id, cid)),
  );

  childData$ = merge(
    this.issueService.issue,
    this.reloadChilds$,
  ).pipe(
    switchMap(() => {
      const v = this.issueService.issueForm.getRawValue();
      if (!v?.id || v.id === 'new') {
        return of(this.emptyChilds);
      }
      return this.dataService.getChildIssues(String(v.id)).pipe(
        catchError(() => of(this.emptyChilds)),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  childKeys$ = this.childData$.pipe(
    map((d) =>
      (d.childs ?? [])
        .map((c) => (c.key ?? '').trim())
        .filter(Boolean),
    ),
    startWith([] as string[]),
  );

  hasProgress(data: IssueChilds): boolean {
    return (data.childs_total ?? 0) > 0;
  }

  removePendingSubtask(id: string): void {
    this.issueService.removePendingSubtask(id);
    this.cd.markForCheck();
  }

  /** Attach an existing issue as a child via its `links.parent`. */
  async linkChild(issue: Issue): Promise<void> {
    const key = (issue.key ?? '').trim();
    if (!key || !issue.id) {
      return;
    }
    const parent = this.issueService.issueForm.getRawValue();
    if (!parent.id || parent.id === 'new') {
      this.toastService.info(
        this.transloco.translate('task.subtask-save-first'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(parent.id),
        parent.container?.id ? String(parent.container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    if ((parent.key ?? '').trim() === key) {
      this.toastService.info(this.transloco.translate('task.subtask-self'));
      return;
    }
    try {
      const childIssue = await firstValueFrom(
        this.dataService.getIssue(String(issue.id)),
      );
      const parentId = String(parent.id);
      const existingParents = childIssue.links?.parent ?? [];
      if (
        existingParents.some(
          (p) =>
            String(p.id) === parentId ||
            (p.key ?? '').trim() === (parent.key ?? '').trim(),
        )
      ) {
        this.toastService.info(
          this.transloco.translate('task.subtask-duplicate'),
        );
        return;
      }
      const parentLink = parentIssueToLink(parent as Issue);
      const links = {
        parent: [...existingParents, parentLink],
        related: childIssue.links?.related ?? [],
        prev_issue: childIssue.links?.prev_issue ?? [],
        next_issue: childIssue.links?.next_issue ?? [],
      };
      await firstValueFrom(
        this.dataService.saveIssue(String(childIssue.id), {
          links,
        } as Issue),
      );
      await this.refreshParentAndChildList();
    } catch {
      this.toastService.error(
        this.transloco.translate('task.subtask-mutation-error'),
      );
    }
    this.cd.markForCheck();
  }

  /** Opens modal to create several child issues from titles (legacy “Decomposite”). */
  async openDecomposite(): Promise<void> {
    const parent = this.issueService.issueForm.getRawValue();
    if (!parent.id || parent.id === 'new') {
      return;
    }
    if (!parent.container?.id) {
      this.toastService.info(
        this.transloco.translate('task.subtask-add-no-container'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(parent.id),
        String(parent.container.id),
      ),
    );
    if (!canEdit) {
      return;
    }
    this.modalService.add(TaskDecompositeModalComponent, {
      issueParent: parent as Issue,
      afterCreate: () => {
        void this.refreshParentAndChildList();
      },
    });
  }

  /** Opens a new task in the shell with this issue as `links.parent` (same pattern as milestone “add task”). */
  async addChild(): Promise<void> {
    const parent = this.issueService.issueForm.getRawValue();
    if (!parent.id || parent.id === 'new') {
      return;
    }
    if (!parent.container?.id) {
      this.toastService.info(
        this.transloco.translate('task.subtask-add-no-container'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(parent.id),
        String(parent.container.id),
      ),
    );
    if (!canEdit) {
      return;
    }
    const parentLink = parentIssueToLink(parent);
    const links: IssueLinks = {
      parent: [parentLink],
      related: [],
      prev_issue: [],
      next_issue: [],
    };
    await this.router.navigate([{ outlets: { section: ['task', 'new'] } }]);
    setTimeout(() => {
      this.issueService.updateFromTemplate({
        container: parent.container,
        links,
      });
    });
  }

  async unlinkChild(child: Issue): Promise<void> {
    const parent = this.issueService.issueForm.getRawValue();
    if (!parent.id || parent.id === 'new' || !child?.id) {
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(parent.id),
        parent.container?.id ? String(parent.container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    try {
      const childIssue = await firstValueFrom(
        this.dataService.getIssue(String(child.id)),
      );
      const parentId = String(parent.id);
      const nextParents = (childIssue.links?.parent ?? []).filter(
        (p) => String(p.id) !== parentId,
      );
      const links = {
        parent: nextParents,
        related: childIssue.links?.related ?? [],
        prev_issue: childIssue.links?.prev_issue ?? [],
        next_issue: childIssue.links?.next_issue ?? [],
      };
      await firstValueFrom(
        this.dataService.saveIssue(String(child.id), {
          links,
        } as Issue),
      );
      await this.refreshParentAndChildList();
    } catch {
      this.toastService.error(
        this.transloco.translate('task.subtask-mutation-error'),
      );
    }
    this.cd.markForCheck();
  }

  private async refreshParentAndChildList(): Promise<void> {
    const parent = this.issueService.issueForm.getRawValue();
    if (!parent.id || parent.id === 'new') {
      return;
    }
    try {
      const freshParent = await firstValueFrom(
        this.dataService.getIssue(parent.key || String(parent.id)),
      );
      this.issueService.patchIssue(freshParent, { reset: true });
      this.issueService.setPrevState();
      this.reloadChilds$.next();
    } catch {
      this.toastService.error(
        this.transloco.translate('task.subtask-mutation-error'),
      );
    }
    this.cd.markForCheck();
  }
}
