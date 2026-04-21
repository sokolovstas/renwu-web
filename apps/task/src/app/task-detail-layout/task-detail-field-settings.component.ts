import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwButtonComponent, RwCheckboxComponent } from '@renwu/components';
import {
  RwSettingsService,
  TASK_DETAIL_FORM_FIELD_KEYS,
  TaskDetailFormFieldKey,
  TaskDetailLayoutFieldKey,
  taskDetailSectionFieldKey,
} from '@renwu/core';
import { TaskDetailVisibilityService } from './task-detail-visibility.service';

const FORM_FIELD_LABEL: Record<TaskDetailFormFieldKey, string> = {
  container: 'task.container',
  milestones: 'task.milestones',
  type: 'task.type',
  priority: 'task.priority',
  status: 'task.status',
  affected_versions: 'task.affected-version',
  assignes: 'task.assignee',
  estimated_time: 'task.estimated-time',
  watchers: 'task.watchers',
  labels: 'task.labels',
  comments: 'task.comments',
};

@Component({
  selector: 'renwu-task-detail-field-settings',
  standalone: true,
  imports: [TranslocoPipe, FormsModule, RwCheckboxComponent, RwButtonComponent],
  templateUrl: './task-detail-field-settings.component.html',
  styleUrl: './task-detail-field-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailFieldSettingsComponent {
  private settings = inject(RwSettingsService);
  readonly visibility = inject(TaskDetailVisibilityService);

  /** Section element tags from `task.json` (for labels and toggles). */
  @Input({ required: true })
  sectionElements: string[];

  readonly formKeys = TASK_DETAIL_FORM_FIELD_KEYS;
  readonly formFieldLabels = FORM_FIELD_LABEL;

  sectionFieldKey(el: string): TaskDetailLayoutFieldKey {
    return taskDetailSectionFieldKey(el);
  }

  isVisible(field: TaskDetailLayoutFieldKey): boolean {
    const cid = this.visibility.getContainerId();
    return this.settings.user.isTaskDetailFieldVisible(cid, field);
  }

  setVisible(field: TaskDetailLayoutFieldKey, visible: boolean): void {
    this.settings.user.setTaskDetailFieldVisible(
      this.visibility.getContainerId(),
      field,
      visible,
    );
  }

  restoreDefaults(): void {
    this.settings.user.clearTaskDetailLayoutForContainer(
      this.visibility.getContainerId(),
    );
  }
}
