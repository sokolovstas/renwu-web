import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalHeaderDirective,
  RwModalService,
  RwTextAreaComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
  RwToastService,
} from '@renwu/components';
import {
  RwDataService,
  RwIssueService,
  RwPolicyService,
  RwUserService,
  TimeLog,
  User,
  UserD,
} from '@renwu/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-task-time-log-add-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RwModalComponent,
    RwModalHeaderDirective,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwButtonComponent,
    RwTimePickerComponent,
    RwTextAreaComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './task-time-log-add-modal.component.html',
  styleUrl: './task-time-log-add-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTimeLogAddModalComponent implements OnInit {
  private static readonly MAX_LOG_SECONDS = 300 * 3600;

  /** Assigned by `RwModalService.add` via `Object.assign`. */
  issueId!: string;
  containerId!: string;
  /** Issue completion % when opening the modal (0–100). */
  initialCompletion?: number;

  dataService = inject(RwDataService);
  issueService = inject(RwIssueService);
  userService = inject(RwUserService);
  policyService = inject(RwPolicyService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  modalService = inject(RwModalService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);

  submitting = false;

  readonly form = this.fb.nonNullable.group({
    duration: [3600, [Validators.required, Validators.min(1)]],
    comment: [''],
    completion: [
      0,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
  });

  ngOnInit(): void {
    const c = this.initialCompletion;
    this.form.patchValue({
      completion: typeof c === 'number' && Number.isFinite(c) ? c : 0,
    });
  }

  cancel(): void {
    this.modalService.close();
  }

  private userToAuthor(user: User | null): UserD {
    if (!user?.id) {
      return { id: '', username: '', full_name: '', avatar_id: '' };
    }
    return {
      id: String(user.id),
      username: user.username ?? '',
      full_name: user.full_name ?? '',
      avatar_id: user.avatar_id ?? '',
    };
  }

  private buildPayload(value: number, comment: string, completion: number): TimeLog {
    const stamp = new Date().toISOString();
    return {
      author: this.userToAuthor(this.userService.getUser()),
      comment: comment.trim(),
      completion,
      date_created: stamp,
      date_started: stamp,
      value,
    };
  }

  async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(this.issueId, this.containerId ?? ''),
    );
    if (!canEdit) {
      this.modalService.close();
      return;
    }
    const raw = this.form.getRawValue();
    const duration = Number(raw.duration) || 0;
    if (duration <= 0) {
      this.toastService.info(
        this.transloco.translate('task.time-log-duration-required'),
      );
      return;
    }
    if (duration > TaskTimeLogAddModalComponent.MAX_LOG_SECONDS) {
      this.toastService.info(
        this.transloco.translate('task.time-log-duration-too-long'),
      );
      return;
    }
    const completion = Math.min(
      100,
      Math.max(0, Math.round(Number(raw.completion) || 0)),
    );
    const author = this.userToAuthor(this.userService.getUser());
    if (!author.id) {
      this.toastService.error(
        this.transloco.translate('task.time-log-error'),
      );
      return;
    }
    const body = this.buildPayload(duration, raw.comment ?? '', completion);
    this.submitting = true;
    this.cd.markForCheck();
    try {
      const issue = await firstValueFrom(
        this.dataService.logIssueTime(this.issueId, body),
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
      this.modalService.close();
    } catch {
      this.toastService.error(
        this.transloco.translate('task.time-log-error'),
      );
    } finally {
      this.submitting = false;
      this.cd.markForCheck();
    }
  }
}
