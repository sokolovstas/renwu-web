import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDurationToStringPipe,
  RwIconComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalHeaderDirective,
  RwModalService,
  RwTextInputComponent,
  RwTimePickerComponent,
  RwToastService,
} from '@renwu/components';
import {
  Issue,
  RwContainerService,
  RwDataService,
  RwPolicyService,
} from '@renwu/core';
import { JSONUtils } from '@renwu/utils';
import { firstValueFrom } from 'rxjs';

import { parentIssueToLink } from './parent-issue-to-link';

interface DecompositeDraftRow {
  title: string;
  estimated_time: number;
  cloneTodo: boolean;
}

@Component({
  selector: 'renwu-task-decomposite-modal',
  standalone: true,
  imports: [
    RwModalComponent,
    RwModalHeaderDirective,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwButtonComponent,
    RwCheckboxComponent,
    RwTextInputComponent,
    RwTimePickerComponent,
    RwIconComponent,
    FormsModule,
    TranslocoPipe,
    RwDurationToStringPipe,
  ],
  templateUrl: './task-decomposite-modal.component.html',
  styleUrl: './task-decomposite-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDecompositeModalComponent implements AfterViewInit {
  /** Assigned by `RwModalService.add` via `Object.assign`. */
  issueParent!: Issue;

  /** Optional callback after all child issues are created successfully. */
  afterCreate?: () => void;

  dataService = inject(RwDataService);
  policyService = inject(RwPolicyService);
  containerService = inject(RwContainerService);
  modalService = inject(RwModalService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('newTitleInput')
  newTitleInput?: RwTextInputComponent;

  issues: DecompositeDraftRow[] = [];
  cloneTodoDefault = true;
  newTitle = '';
  inProgress = false;
  canEditEstimate = false;
  /** Loaded from `RwContainerService.getIssueTemplate`; `null` until bootstrap completes. */
  issueTemplate: Issue | null = null;

  async ngAfterViewInit(): Promise<void> {
    await this.bootstrap();
    this.newTitleInput?.setFocus();
    this.cd.markForCheck();
  }

  private async bootstrap(): Promise<void> {
    const cid = String(this.issueParent.container?.id ?? '');
    if (!cid) {
      this.toastService.error(
        this.transloco.translate('task.subtask-decomposite-load-error'),
      );
      this.modalService.close();
      return;
    }
    try {
      this.issueTemplate = await this.containerService.getIssueTemplate(cid);
      this.canEditEstimate = await firstValueFrom(
        this.policyService.canEditFieldEstimatedTime('new', cid),
      );
    } catch {
      this.issueTemplate = null;
      this.canEditEstimate = false;
      this.toastService.error(
        this.transloco.translate('task.subtask-decomposite-load-error'),
      );
      this.modalService.close();
    }
    this.cd.markForCheck();
  }

  onCloneTodoDefaultChange(value: boolean): void {
    this.cloneTodoDefault = value;
    for (const row of this.issues) {
      row.cloneTodo = value;
    }
    this.cd.markForCheck();
  }

  onNewTitleChange(value: string): void {
    const title = (value ?? '').trim();
    if (!title || !this.issueTemplate) {
      return;
    }
    this.issues.push({
      title,
      estimated_time:
        this.issueTemplate.estimated_time ?? 4 * 60 * 60,
      cloneTodo: this.cloneTodoDefault,
    });
    this.newTitle = '';
    this.cd.markForCheck();
  }

  deleteIssue(index: number): void {
    this.issues.splice(index, 1);
    this.cd.markForCheck();
  }

  getTotalEstimateSeconds(): number {
    let total = 0;
    for (const row of this.issues) {
      total += Number(row.estimated_time) || 0;
    }
    return total;
  }

  close(): void {
    this.modalService.close();
  }

  private buildIssuePayload(
    parent: Issue,
    row: DecompositeDraftRow,
    template: Issue,
  ): Issue {
    const issue = JSONUtils.jsonClone(template) as Issue;
    delete issue.id;
    delete issue.key;
    issue.links = {
      parent: [parentIssueToLink(parent)],
      related: [],
      prev_issue: [],
      next_issue: [],
    };
    issue.title = row.title.trim();
    issue.estimated_time = row.estimated_time ?? template.estimated_time ?? 0;
    issue.assignes = issue.assignes ?? [];
    if (row.cloneTodo) {
      issue.todos = JSONUtils.jsonClone(parent.todos ?? []);
      issue.description = parent.description ?? '';
    } else {
      issue.todos = issue.todos ?? [];
      issue.description = issue.description ?? '';
    }
    issue.attachments = [];
    issue.time_logs = [];
    issue.time_logged = issue.time_logged ?? 0;
    issue.completion = issue.completion ?? 0;
    issue.have_childs = false;
    return issue;
  }

  async onCreate(): Promise<void> {
    const rows = this.issues.filter((r) => r.title.trim().length > 0);
    if (!rows.length || !this.issueTemplate) {
      return;
    }
    this.inProgress = true;
    this.cd.markForCheck();
    const parent = this.issueParent;
    const template = this.issueTemplate;
    for (const row of rows) {
      try {
        const payload = this.buildIssuePayload(parent, row, template);
        await firstValueFrom(this.dataService.addIssue(payload));
      } catch {
        this.inProgress = false;
        this.toastService.error(
          this.transloco.translate('task.subtask-decomposite-error'),
        );
        this.cd.markForCheck();
        return;
      }
    }
    this.inProgress = false;
    this.afterCreate?.();
    this.modalService.close();
    this.cd.markForCheck();
  }
}
