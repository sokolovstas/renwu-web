import { differenceInHours } from 'date-fns';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwDatePipe,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalHeaderDirective,
  RwTextInputComponent,
  RwTimePickerComponent,
} from '@renwu/components';
import {
  RwFormatUserPipe,
  RwPolicyService,
  RwSettingsService,
  RwUserService,
  TimeLog,
} from '@renwu/core';

@Component({
  selector: 'renwu-task-time-logs-editor',
  standalone: true,
  imports: [
    RwModalComponent,
    RwModalHeaderDirective,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwTimePickerComponent,
    RwTextInputComponent,
    FormsModule,
    RwFormatUserPipe,
    RwButtonComponent,
    RwDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './time-logs-editor.component.html',
  styleUrl: './time-logs-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTimeLogsEditorComponent implements OnInit {
  @Input({ required: true })
  logs!: TimeLog[];

  @Input({ required: true })
  issueId!: string;

  @Output()
  readonly save = new EventEmitter<void>();

  userService = inject(RwUserService);
  policyService = inject(RwPolicyService);
  settingsService = inject(RwSettingsService);
  private cd = inject(ChangeDetectorRef);

  canEditLogs = false;

  hideTooltip = true;

  ngOnInit(): void {
    this.policyService
      .canEditFieldCompletion(this.issueId)
      .subscribe((allowed) => {
        this.canEditLogs = allowed;
        this.cd.markForCheck();
      });
  }

  canEdit(tlog: TimeLog): boolean {
    if (!tlog.author || !tlog.author.id) {
      return false;
    }
    const isAuthor = this.userService.getIsCurrent(tlog.author.id);
    const past24Hour =
      differenceInHours(new Date(), new Date(tlog.date_created)) < 24;
    const canEdit =
      this.userService.getIsAdmin() ||
      (isAuthor && this.canEditLogs && past24Hour);
    this.hideTooltip = this.hideTooltip && canEdit;
    return canEdit;
  }

  onSave(): void {
    this.save.emit();
    this.cd.markForCheck();
  }
}
