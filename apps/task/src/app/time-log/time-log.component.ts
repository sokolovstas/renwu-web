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
  TimeLog,
} from '@renwu/core';
import { firstValueFrom, map, merge, startWith } from 'rxjs';

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
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  fb = inject(FormBuilder);

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

  summary$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.time_logged.valueChanges,
    this.issueService.issueForm.controls.completion.valueChanges,
  ).pipe(
    map(() => {
      const v = this.issueService.issueForm.getRawValue();
      return {
        time_logged: v.time_logged ?? 0,
        completion: v.completion ?? 100,
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
    const f = this.logForm.getRawValue();
    const body = {
      value: f.duration,
      completion: raw.completion ?? 0,
      comment: (f.comment ?? '').trim(),
    } as TimeLog;
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
    this.cd.markForCheck();
  }
}
