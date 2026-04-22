import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwSelectComponent } from '@renwu/components';
import { Issue } from '@renwu/core';

@Component({
  selector: 'renwu-task-issue-link-search-input',
  standalone: true,
  imports: [FormsModule, RwSelectComponent, TranslocoPipe],
  templateUrl: './issue-link-search-input.component.html',
  styleUrl: './issue-link-search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueLinkSearchInputComponent {
  private readonly cd = inject(ChangeDetectorRef);

  /** Transloco key for rw-select floating label. */
  @Input({ required: true })
  promptKey!: string;

  /** Current task key — picking self clears selection without emitting. */
  @Input()
  selfKey: string | null = null;

  /** Already linked keys; picking one clears selection without emitting (parent still validates on emit). */
  @Input()
  forbiddenKeys: string[] = [];

  @Output()
  readonly issuePicked = new EventEmitter<Issue>();

  /** rw-select CVA value; cleared after each successful pick. */
  selectedIssue: Issue | null = null;

  readonly selectModelName = 'IssueLink';

  onSelectValue(issue: Issue | null): void {
    if (!issue) {
      return;
    }
    const key = (issue.key ?? '').trim().toLowerCase();
    if (!key) {
      this.clearSelection();
      return;
    }
    const self = (this.selfKey ?? '').trim().toLowerCase();
    if (self && key === self) {
      this.clearSelection();
      return;
    }
    const forbidden = new Set(
      this.forbiddenKeys.map((k) => k.trim().toLowerCase()).filter(Boolean),
    );
    if (forbidden.has(key)) {
      this.clearSelection();
      return;
    }
    this.issuePicked.emit(issue);
    this.clearSelection();
  }

  private clearSelection(): void {
    queueMicrotask(() => {
      this.selectedIssue = null;
      this.cd.markForCheck();
    });
  }
}
