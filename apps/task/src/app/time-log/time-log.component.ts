import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwDatePipe,
  RwDurationToStringPipe,
  RwTextAreaComponent,
  RwTimePickerComponent,
  RwToastService,
} from '@renwu/components';
import {
  RwDataService,
  RwFormatUserPipe,
  RwIssueService,
  RwPolicyService,
  TimeLog,
} from '@renwu/core';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'renwu-task-time-log',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwButtonComponent,
    RwDatePipe,
    RwDurationToStringPipe,
    RwFormatUserPipe,
    RwTextAreaComponent,
    RwTimePickerComponent,
    TranslocoPipe,
  ],
  templateUrl: './time-log.component.html',
  styleUrl: './time-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogComponent {
  private static readonly MAX_LOG_SECONDS = 300 * 3600;

  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  fb = inject(FormBuilder);
  policyService = inject(RwPolicyService);

  isNewIssue = this.issueService.newIssue;

  logForm = this.fb.nonNullable.group({
    duration: [3600],
    comment: [''],
  });

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
        completion: v.completion ?? 0,
      };
    }),
  );

  async addLog(): Promise<void> {
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
    const f = this.logForm.getRawValue();
    const duration = Number(f.duration) || 0;
    if (duration <= 0) {
      this.toastService.info(
        this.transloco.translate('task.time-log-duration-required'),
      );
      return;
    }
    if (duration > TimeLogComponent.MAX_LOG_SECONDS) {
      this.toastService.info(
        this.transloco.translate('task.time-log-duration-too-long'),
      );
      return;
    }
    const body = {
      value: duration,
      completion: raw.completion ?? 0,
      comment: (f.comment ?? '').trim(),
    } as TimeLog;
    try {
      const issue = await firstValueFrom(
        this.dataService.logIssueTime(String(raw.id), body),
      );
      this.issueService.patchIssue(
        {
          time_logs: issue.time_logs ?? [],
          time_logged: issue.time_logged,
          completion: issue.completion,
        },
        { emitEvent: true },
      );
      this.issueService.setPrevState();
      this.logForm.patchValue({ duration: 3600, comment: '' });
    } catch {
      this.toastService.error(
        this.transloco.translate('task.time-log-error'),
      );
    }
    this.cd.markForCheck();
  }
}
