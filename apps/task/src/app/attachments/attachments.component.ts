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
  RwDatePipe,
  RwIconComponent,
  RwToastService,
} from '@renwu/components';
import {
  Attachment,
  AttachmentComponent,
  FileUpload,
  RW_CORE_SETTINGS,
  RwCoreSettings,
  RwDataService,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import { testImageExtension } from '@renwu/utils';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  startWith,
  switchMap,
} from 'rxjs';

export interface TaskUiAttachment extends Attachment {
  openHref: string;
  downloadHref: string;
  isImage: boolean;
}

export interface TaskAttachmentView {
  images: TaskUiAttachment[];
  others: TaskUiAttachment[];
  hasAny: boolean;
}

@Component({
  selector: 'renwu-task-attachments',
  standalone: true,
  imports: [
    AsyncPipe,
    AttachmentComponent,
    RwButtonComponent,
    RwDatePipe,
    RwIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentsComponent {
  issueService = inject(RwIssueService);
  dataService = inject(RwDataService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  alertService = inject(RwAlertService);
  policyService = inject(RwPolicyService);
  private readonly settings = inject<RwCoreSettings>(RW_CORE_SETTINGS);

  isNewIssue = this.issueService.newIssue;

  /** Legacy-style expand/collapse for the attachment list. */
  listExpanded = true;

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
    distinctUntilChanged(
      (a, b) => a.id === b.id && a.cid === b.cid,
    ),
    switchMap(({ id, cid }) => this.policyService.canEditIssue(id, cid)),
  );

  attachmentView$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.attachments.valueChanges,
  ).pipe(
    map(() => this.buildAttachmentView()),
    startWith(this.buildAttachmentView()),
  );

  toggleList(): void {
    this.listExpanded = !this.listExpanded;
    this.cd.markForCheck();
  }

  private buildAttachmentView(): TaskAttachmentView {
    const raw = this.issueService.issueForm.getRawValue();
    const list = raw.attachments ?? [];
    const issueId =
      raw.id && raw.id !== 'new' ? String(raw.id) : null;
    const images: TaskUiAttachment[] = [];
    const others: TaskUiAttachment[] = [];
    for (const att of list) {
      const ui = this.mapAttachment(att, issueId);
      if (ui.isImage) {
        images.push(ui);
      } else {
        others.push(ui);
      }
    }
    return { images, others, hasAny: list.length > 0 };
  }

  private mapAttachment(
    att: Attachment,
    issueId: string | null,
  ): TaskUiAttachment {
    const url = att.url ?? '';
    const mediaBase = (this.settings.mediaUrl ?? '').replace(/\/$/, '');
    const openHref =
      url.includes('://') || !mediaBase
        ? url
        : `${mediaBase}/${url.replace(/^\//, '')}`;
    const downloadHref =
      issueId && att.id
        ? `${this.settings.rootApiUrl}/issue/${issueId}/attachment/${att.id}?filename=${encodeURIComponent(att.file_name)}`
        : openHref;
    return {
      ...att,
      openHref,
      downloadHref,
      isImage: testImageExtension(att.file_name),
    };
  }

  async onFileUploaded(file: FileUpload): Promise<void> {
    if (!file.__loaded) {
      return;
    }
    const { id, container } = this.issueService.issueForm.getRawValue();
    if (id === 'new' || !id) {
      this.toastService.info(
        this.transloco.translate('task.attachments-save-first'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(id),
        container?.id ? String(container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    try {
      const issue = await firstValueFrom(
        this.dataService.addIssueAttachment(String(id), file),
      );
      this.issueService.patchIssue(
        { attachments: issue.attachments ?? [] },
        { emitEvent: true },
      );
      this.issueService.setPrevState();
      this.listExpanded = true;
    } catch {
      this.toastService.error(
        this.transloco.translate('task.attachments-mutation-error'),
      );
    }
    this.cd.markForCheck();
  }

  async remove(att: Attachment): Promise<void> {
    const { id, key, container } = this.issueService.issueForm.getRawValue();
    if (id === 'new' || !id) {
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(id),
        container?.id ? String(container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    const result = await firstValueFrom(
      this.alertService.confirm(
        this.transloco.translate('task.attachments-delete-title'),
        this.transloco.translate('task.attachments-delete-message', {
          file: att.file_name,
        }),
        true,
        this.transloco.translate('core.delete'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!result?.affirmative) {
      return;
    }
    try {
      await firstValueFrom(
        this.dataService.deleteIssueAttachment(String(id), att.id),
      );
      const fresh = await firstValueFrom(
        this.dataService.getIssue(key || String(id)),
      );
      this.issueService.patchIssue(
        { attachments: fresh.attachments ?? [] },
        { emitEvent: true },
      );
      this.issueService.setPrevState();
    } catch {
      this.toastService.error(
        this.transloco.translate('task.attachments-mutation-error'),
      );
    }
    this.cd.markForCheck();
  }
}
