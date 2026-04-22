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
  RwDatePipe,
  RwDurationToStringPipe,
  RwIconComponent,
  RwModalService,
  RwToastService,
} from '@renwu/components';
import {
  Issue,
  RwFormatUserPipe,
  RwIssueService,
  RwPolicyService,
  TimeLog,
} from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import {
  Observable,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  of,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { TaskTimeLogAddModalComponent } from './task-time-log-add-modal.component';
import { TaskTimeLogsEditorComponent } from './time-logs-editor.component';

@Component({
  selector: 'renwu-task-time-log',
  standalone: true,
  imports: [
    AsyncPipe,
    RwButtonComponent,
    RwDatePipe,
    RwDurationToStringPipe,
    RwFormatUserPipe,
    RwIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './time-log.component.html',
  styleUrl: './time-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogComponent {
  issueService = inject(RwIssueService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  policyService = inject(RwPolicyService);
  modalService = inject(RwModalService);

  isNewIssue = this.issueService.newIssue;

  timeLogs$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.time_logs.valueChanges,
  ).pipe(
    map(
      () => this.issueService.issueForm.getRawValue().time_logs ?? [],
    ),
    startWith(this.issueService.issueForm.getRawValue().time_logs ?? []),
  );

  timeLogSection$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.valueChanges.pipe(
      startWith(this.issueService.issueForm.value),
    ),
  ).pipe(
    map(() => {
      const v = this.issueService.issueForm.getRawValue();
      const id = !v.id || v.id === 'new' ? null : String(v.id);
      const cid = v.container?.id ? String(v.container.id) : '';
      return {
        id,
        cid,
        haveChilds: !!v.have_childs,
      };
    }),
    distinctUntilChanged(
      (a, b) =>
        a.id === b.id && a.cid === b.cid && a.haveChilds === b.haveChilds,
    ),
    switchMap(({ id, cid, haveChilds }) => {
      if (!id) {
        return of({ canEdit: false, haveChilds, canLog: false });
      }
      return this.policyService.canEditIssue(id, cid).pipe(
        map((canEdit) => ({
          canEdit,
          haveChilds,
          canLog: canEdit && !haveChilds,
        })),
      );
    }),
  );

  summary$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.time_logged.valueChanges,
    this.issueService.issueForm.controls.completion.valueChanges,
  ).pipe(
    map(() => {
      const v = this.issueService.issueForm.getRawValue();
      return {
        time_logged: v.time_logged ?? 0,
        /** Display default when API omits completion (legacy modal baseline). */
        completion: v.completion ?? 95,
      };
    }),
  );

  openTimeLogsEditor(): void {
    const raw = this.issueService.issueForm.getRawValue();
    if (raw.id === 'new' || !raw.id) {
      return;
    }
    const prev = JSONUtils.jsonClone(raw) as Issue;
    const logs = JSONUtils.jsonClone(raw.time_logs ?? []) as TimeLog[];
    const modal = this.modalService.add(TaskTimeLogsEditorComponent, {
      logs,
      issueId: String(raw.id),
    });
    modal.save.pipe(take(1)).subscribe(() => {
      const next = { ...prev, time_logs: logs } as Issue;
      (this.issueService.save(prev, next) as Observable<Issue | null>).subscribe({
        next: () => {
          this.issueService.patchIssue({ time_logs: logs }, { emitEvent: true });
          this.modalService.close();
          this.issueService.setPrevState();
          this.cd.markForCheck();
        },
        error: () => {
          this.toastService.error(
            this.transloco.translate('task.time-log-error'),
          );
        },
      });
    });
  }

  async openAddLogModal(): Promise<void> {
    const raw = this.issueService.issueForm.getRawValue();
    if (raw.id === 'new' || !raw.id) {
      this.toastService.info(
        this.transloco.translate('task.time-log-save-first'),
      );
      return;
    }
    if (raw.have_childs) {
      this.toastService.info(
        this.transloco.translate('task.time-log-parent-has-subtasks'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(raw.id),
        raw.container?.id ? String(raw.container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    this.modalService.add(TaskTimeLogAddModalComponent, {
      issueId: String(raw.id),
      containerId: raw.container?.id ? String(raw.container.id) : '',
      initialCompletion: raw.completion ?? 0,
    });
    this.cd.markForCheck();
  }
}
