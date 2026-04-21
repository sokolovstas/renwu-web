import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwAlertService,
  RwButtonComponent,
  RwToastService,
} from '@renwu/components';
import {
  Issue,
  IssueChilds,
  IssueHrefComponent,
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
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'renwu-task-sub-task',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    IssueHrefComponent,
    IssueStatusComponent,
    IssuesStatusBarComponent,
    RwButtonComponent,
  ],
  template: `
    @let isNew = isNewIssue | async;
    @let canEdit = canEdit$ | async;
    <div class="mt-4 mx-2">
      <div class="font-extralight text-2xl mb-2">
        {{ 'task.subtask' | transloco }}
      </div>
      @if (isNew) {
        <p class="text-sm opacity-70 mb-2">{{ 'task.subtask-save-first' | transloco }}</p>
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
                      (clicked)="unlinkChild(c)"
                    />
                  }
                </div>
              </div>
            } @empty {
              <span class="text-sm opacity-50 px-1">{{
                'task.subtask-empty' | transloco
              }}</span>
            }
          </div>
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
  alertService = inject(RwAlertService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);

  private readonly reloadChilds$ = new Subject<void>();

  private readonly emptyChilds: IssueChilds = {
    childs: [],
    childs_completed_total: 0,
    childs_estimated_total: 0,
    childs_resolved: 0,
    childs_total: 0,
  };

  isNewIssue = this.issueService.newIssue;

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
  );

  hasProgress(data: IssueChilds): boolean {
    return (data.childs_total ?? 0) > 0;
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
    const confirm = await firstValueFrom(
      this.alertService.confirm(
        this.transloco.translate('task.subtask-unlink-title'),
        this.transloco.translate('task.subtask-unlink-message', {
          key: child.key || child.title || String(child.id),
        }),
        true,
        this.transloco.translate('core.delete'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!confirm?.affirmative) {
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
