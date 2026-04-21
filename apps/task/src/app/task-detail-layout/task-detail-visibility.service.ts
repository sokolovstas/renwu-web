import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  RwIssueService,
  RwSettingsService,
  TaskDetailLayoutFieldKey,
  taskDetailSectionFieldKey,
} from '@renwu/core';
import { merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TaskSectionConfig } from '../task-sections/task-section.model';

@Injectable({ providedIn: 'root' })
export class TaskDetailVisibilityService {
  private issueService = inject(RwIssueService);
  private settingsService = inject(RwSettingsService);

  private issue = toSignal(this.issueService.issue, {
    initialValue: undefined,
  });

  /** Recomputes when issue, form container, or user layout settings change. */
  private readonly layoutTick = toSignal(
    merge(
      this.issueService.issue,
      this.issueService.issueForm.valueChanges.pipe(
        startWith(this.issueService.issueForm.value),
      ),
      this.settingsService.user.updated,
    ).pipe(map((): undefined => undefined)),
    { initialValue: undefined },
  );

  /** Visible when not in the per-project hidden list; unknown project → all visible. */
  isVisible(field: TaskDetailLayoutFieldKey): boolean {
    this.layoutTick();
    const containerId = this.getContainerId();
    return this.settingsService.user.isTaskDetailFieldVisible(containerId, field);
  }

  filterSections(sections: TaskSectionConfig[]): TaskSectionConfig[] {
    this.layoutTick();
    const containerId = this.getContainerId();
    return sections.filter((s) =>
      this.settingsService.user.isTaskDetailFieldVisible(
        containerId,
        taskDetailSectionFieldKey(s.element),
      ),
    );
  }

  getContainerId(): string | undefined {
    return (
      this.issue()?.container?.id ??
      this.issueService.issueForm.getRawValue().container?.id ??
      undefined
    );
  }
}
