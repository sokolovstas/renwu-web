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
  RwModalService,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import {
  Attachment,
  AttachmentComponent,
  FileUpload,
  ImageViewerComponent,
  RW_CORE_SETTINGS,
  RwCoreSettings,
  RwDataService,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import { DestinationType, RwMessageService } from '@renwu/messaging';
import { copyToClipboard, testImageExtension } from '@renwu/utils';
import {
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  startWith,
  switchMap,
  take,
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
    RwTooltipDirective,
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
  modalService = inject(RwModalService);
  messageService = inject(RwMessageService);
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

  openImageViewer(images: TaskUiAttachment[], startIndex: number): void {
    if (!images.length) {
      return;
    }
    const prepared = images.map((a) => ({
      ...a,
      href: a.openHref,
      href_file_name: a.downloadHref,
    }));
    const viewer = this.modalService.add(ImageViewerComponent, {
      images: prepared,
      currentIndex: Math.min(
        Math.max(0, startIndex),
        prepared.length - 1,
      ),
      hostClose: () => this.modalService.close(),
    });
    viewer.deleteImage.pipe(take(1)).subscribe((att) => {
      void this.onImageViewerDelete(att as Attachment);
    });
  }

  private async onImageViewerDelete(att: Attachment): Promise<void> {
    const removed = await this.remove(att);
    if (removed) {
      this.modalService.close();
    }
  }

  copyAttachmentMarkdown(att: TaskUiAttachment): void {
    const md = this.buildAttachmentMarkdown(att);
    void copyToClipboard(md).then(
      () => {
        this.toastService.info(
          this.transloco.translate('task.attachments-markdown-copied'),
        );
        this.cd.markForCheck();
      },
      () => {
        this.toastService.error(
          this.transloco.translate('task.attachments-markdown-copy-error'),
        );
        this.cd.markForCheck();
      },
    );
  }

  postAttachmentToMessages(att: TaskUiAttachment): void {
    const raw = this.issueService.issueForm.getRawValue();
    if (!raw.id || raw.id === 'new') {
      return;
    }
    const destination = {
      id: String(raw.id),
      type: DestinationType.ISSUE,
    };
    this.messageService
      .postFileMessage(destination, att.url ?? '', att.file_name)
      .subscribe({
        next: () => {
          this.toastService.info(
            this.transloco.translate('task.attachments-posted-to-messages'),
          );
          this.cd.markForCheck();
        },
        error: () => {
          this.toastService.error(
            this.transloco.translate('task.attachments-post-to-messages-error'),
          );
          this.cd.markForCheck();
        },
      });
  }

  private buildAttachmentMarkdown(att: TaskUiAttachment): string {
    const href = att.openHref;
    const fileName = att.file_name;
    if (testImageExtension(fileName)) {
      return `[${fileName}](${href}):\n![${fileName}](${href})\n`;
    }
    return `[${fileName}](${href})\n`;
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

  /** Strip upload progress fields before PUT /issue/:id (legacy payload is Attachment only). */
  private fileUploadToAttachment(file: FileUpload): Attachment {
    return {
      id: String(file.id ?? ''),
      file_name: file.file_name ?? '',
      url: file.url ?? '',
      owner: file.owner,
      date_created: file.date_created ?? '',
      source: file.source ?? '',
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
        this.dataService.addIssueAttachment(
          String(id),
          this.fileUploadToAttachment(file),
        ),
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

  /** @returns whether the attachment was removed from the server */
  async remove(att: Attachment): Promise<boolean> {
    const { id, key, container } = this.issueService.issueForm.getRawValue();
    if (id === 'new' || !id) {
      return false;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(id),
        container?.id ? String(container.id) : '',
      ),
    );
    if (!canEdit) {
      return false;
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
      return false;
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
      this.cd.markForCheck();
      return true;
    } catch {
      this.toastService.error(
        this.transloco.translate('task.attachments-mutation-error'),
      );
    }
    this.cd.markForCheck();
    return false;
  }
}
