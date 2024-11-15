import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { MentionsListItem } from '@renwu/mentions';
import { Issue } from '../../issue/issue.model';

@Component({
  selector: 'renwu-mention-issue',
  template: `<div>{{ item.key }} - {{ item.title }}</div>`,
  //   template: `<issue-list-item
  //   [showAssignee]="false"
  //   [showType]="false"
  //   [borderless]="true"
  //   [issue]="item"
  // ></issue-list-item>`,
  standalone: true,
  styleUrl: './mention-issue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionIssueComponent implements MentionsListItem<Issue> {
  @Input()
  item: Issue;

  @Input()
  @HostBinding('class.active')
  active: boolean;
}
