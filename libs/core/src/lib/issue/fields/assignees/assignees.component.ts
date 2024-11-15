
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RwTooltipDirective } from '@renwu/components';
import { AvatarComponent } from '../../../avatar/avatar.component';
import { User, UserStatic } from '../../../user/user.model';
import { Issue } from '../../issue.model';

@Component({
  selector: 'renwu-issue-assignees',
  standalone: true,
  imports: [RwTooltipDirective, AvatarComponent],
  templateUrl: './assignees.component.html',
  styleUrl: './assignees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueAssigneesComponent {
  @Input()
  set issue(value: Issue) {
    this._issue = value;
    this.updateLabel();
  }
  get issue(): Issue {
    return this._issue;
  }
  _issue: Issue;

  autoassignee: boolean;
  label = '';
  assignee: User = null;
  updateLabel() {
    if (
      !this.issue ||
      (this.issue && !this.issue.assignes && !this.issue.assignes_calc)
    ) {
      this.label = '-';
      return;
    }
    let ret: string[] = [];
    if (
      (!this.issue.assignes || this.issue.assignes.length === 0) &&
      (!this.issue.assignes_calc || this.issue.assignes_calc.length === 0)
    ) {
      this.autoassignee = true;
      this.assignee = null;
      ret = ['Team'];
    } else if (this.issue.assignes && this.issue.assignes[0]) {
      this.autoassignee = false;
      this.assignee = this.issue.assignes[0];
      ret = this.issue.assignes.map((user) => UserStatic.getStringValue(user));
    } else if (this.issue.assignes_calc && this.issue.assignes_calc[0]) {
      this.autoassignee = true;
      this.assignee = this.issue.assignes_calc[0];
      ret = this.issue.assignes_calc.map((user) =>
        UserStatic.getStringValue(user),
      );
    }
    this.label = ret.join(', ');
  }
}
