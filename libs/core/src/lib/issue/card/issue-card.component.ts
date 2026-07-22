import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  inject,
} from '@angular/core';
import { Issue } from '../issue.model';
import { IssueAssigneesComponent } from '../fields/assignees/assignees.component';
import { IssuePriorityComponent } from '../fields/priority/priority.component';
import { IssueStatusComponent } from '../fields/status/status.component';
import { IssueTypeComponent } from '../fields/type/type.component';

export type IssueCardDensity = 'normal' | 'compact' | 'detailed';

/**
 * Shared issue card (board-style): key, title, type, priority, status, assignees.
 * Also used as a rich tooltip (`asTooltip`) e.g. on timeline when the table is collapsed.
 */
@Component({
  selector: 'renwu-issue-card',
  standalone: true,
  imports: [
    IssueAssigneesComponent,
    IssuePriorityComponent,
    IssueStatusComponent,
    IssueTypeComponent,
  ],
  templateUrl: './issue-card.component.html',
  styleUrl: './issue-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueCardComponent {
  private readonly cd = inject(ChangeDetectorRef);

  private _issue: Issue;
  private _density: IssueCardDensity | string = 'normal';
  private _asTooltip = false;

  @Input()
  set issue(value: Issue) {
    this._issue = value;
    this.cd.markForCheck();
  }
  get issue(): Issue {
    return this._issue;
  }

  @Input()
  set density(value: IssueCardDensity | string) {
    this._density = value || 'normal';
    this.cd.markForCheck();
  }
  get density(): IssueCardDensity | string {
    return this._density;
  }

  /** When true, host is positioned for floating-ui tooltips. */
  @Input()
  set asTooltip(value: boolean) {
    this._asTooltip = !!value;
    this.cd.markForCheck();
  }
  get asTooltip(): boolean {
    return this._asTooltip;
  }

  @HostBinding('class')
  get hostClass(): string {
    return [
      'renwu-issue-card',
      `renwu-issue-card--${this._density || 'normal'}`,
      this._asTooltip ? 'renwu-issue-card--tooltip' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
