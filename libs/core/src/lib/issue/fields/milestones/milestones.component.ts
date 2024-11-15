
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MilestoneD } from '../../../container/milestone.model';
import { User } from '../../../user/user.model';

@Component({
  selector: 'renwu-issue-milestones',
  standalone: true,
  imports: [],
  templateUrl: './milestones.component.html',
  styleUrl: './milestones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueMilestonesComponent {
  @Input()
  value: MilestoneD[] = [];
  @Input()
  parentValue: MilestoneD[] = [];

  autoassignee: boolean;

  getName(user: User): string {
    if (!user.full_name.trim()) {
      return user.username;
    } else {
      return user.full_name;
    }
  }
  getLabel(): string {
    if (!this.value || this.value.length === 0) {
      return '';
    }
    const milestoneArray: string[] = [];
    for (const m of this.value) {
      if (m && m.title) {
        milestoneArray.push(m.title);
      }
    }
    return milestoneArray.join(', ');
  }
  getParentLabel(): string {
    if (!this.parentValue || this.parentValue.length === 0) {
      return '';
    }
    const milestoneArray: string[] = [];
    for (const m of this.parentValue) {
      if (m && m.title) {
        milestoneArray.push(m.title);
      }
    }
    return milestoneArray.join(', ');
  }
}
