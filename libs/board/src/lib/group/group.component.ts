
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, Input, Output, QueryList, ViewChildren, ViewEncapsulation, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwIconComponent
} from '@renwu/components';
import { Issue, RwSettingsService } from '@renwu/core';
import { BoardGroup, BoardGroupsConfig } from '../board.model';
import { CardComponent } from '../card/card.component';
import { SortListPipe } from '../sort-list/sort-list.pipe';

type IssueBoardUi = Issue & { __is_selected?: boolean };

@Component({
  selector: 'renwu-board-group',
  standalone: true,
  imports: [
    SortListPipe,
    RwIconComponent,
    RwButtonComponent,
    CardComponent,
    TranslocoPipe
],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BoardGroupComponent {
  private cd = inject(ChangeDetectorRef);
  private settingsService = inject(RwSettingsService);

  @Input()
  set group(value: BoardGroup) {
    if (!value) {
      return;
    }
    this._group = value;
    if (value.groups.length === 0) {
      this.last = true;
    }
    this.groupsNotFixed = [];
    this.groupsFixed = [];
    value.groups.forEach((group) => {
      if (
        group.parent &&
        group.parent.config &&
        group.parent.config.fixed &&
        group.parent.config.fixed.indexOf(group.id) > -1
      ) {
        this.groupsFixed.push(group);
      } else {
        this.groupsNotFixed.push(group);
      }
    });
    this.uid = value.uid;
  }
  get group(): BoardGroup {
    return this._group;
  }
  _group: BoardGroup;

  groupsNotFixed: BoardGroup[];
  groupsFixed: BoardGroup[];

  @Input()
  parentGroup: BoardGroup;

  @Input()
  config: BoardGroupsConfig;

  @Input()
  @HostBinding('class.collapsed')
  get collapsed(): boolean {
    let collapsed = false;
    if (this.group) {
      const openIndexGroup =
        this.settingsService.user.settings.open_index_group;
      collapsed =
        (openIndexGroup[this.group.uid] ?? this.group.collapsed) &&
        !this.groupOnly;
    }
    if (
      this.group &&
      this.group.groups.length === 0 &&
      this.group.items.length === 0 &&
      this.config.collapseEmpty
    ) {
      collapsed = true;
    }
    return collapsed;
  }

  @HostBinding('class.last-group')
  last: boolean;

  @HostBinding('class.group-only')
  get groupOnly(): boolean {
    if (this.parentGroup && this.parentGroup.config) {
      return this.parentGroup.config.groupOnly;
    }
    return false;
  }

  @HostBinding('class.root-group')
  get rootGroup(): boolean {
    return this.group?.uid === 'root';
  }

  @HostBinding('attr.uid')
  uid: string;

  @HostBinding('class.wip-limit-exceeded')
  get wipLimitExceeded(): boolean {
    return (
      this.group?.wipLimit != null &&
      this.group.wipLimit > 0 &&
      (this.group.reduce?.count ?? 0) > this.group.wipLimit
    );
  }

  @Output()
  check = new EventEmitter<{
    group: BoardGroup;
    issue: Issue;
    all: boolean;
  }>();

  @Output()
  addTask = new EventEmitter<BoardGroup>();

  @Output()
  issueDrop = new EventEmitter<{
    issueId: string;
    targetGroup: BoardGroup;
  }>();

  @Output()
  openIssue = new EventEmitter<Issue>();

  @HostBinding('style.flex')
  get flex() {
    if (
      this.collapsed &&
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns'
    ) {
      return '0 0 43px';
    }
    if (
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns' &&
      this.group.config &&
      this.group.config.view.id === 'rows'
    ) {
      return '0 0 350px';
    }
    if (
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns' &&
      !this.group.config
    ) {
      return '0 0 340px';
    }
    if (this.parentGroup && this.parentGroup.config.view.id === 'columns') {
      return (
        '0 0 ' +
        (this.group.groups.length === 0
          ? '340px'
          : this.group.groups.length * 350 + 0 + 'px')
      );
    }
    if (this.parentGroup && this.parentGroup.config.view.id === 'rows') {
      return '0 0 auto';
    }
    return '1 1 100%';
  }

  @HostBinding('style.width')
  get width() {
    if (
      this.collapsed &&
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns'
    ) {
      return '43px';
    }
    if (
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns' &&
      this.group.config &&
      this.group.config.view.id === 'rows'
    ) {
      return '350px';
    }
    if (
      this.parentGroup &&
      this.parentGroup.config.view.id === 'columns' &&
      !this.group.config
    ) {
      return '340px';
    }
    if (this.parentGroup && this.parentGroup.config.view.id === 'columns') {
      return this.group.groups.length === 0
        ? '340px'
        : this.group.groups.length * 350 + 0 + 'px';
    }
    if (this.parentGroup && this.parentGroup.config.view.id === 'rows') {
      return 'auto';
    }
    return '100%';
  }

  @ViewChildren(BoardGroupComponent)
  groups: QueryList<BoardGroupComponent>;

  configScroll = {
    suppressScrollX: false,
    suppressScrollY: false,
  };

  markForCheck() {
    this.cd.markForCheck();
    this.groups.forEach((group) => {
      group.markForCheck();
    });
  }

  onIssueCheck(select: { group: BoardGroup; issue: Issue; all: boolean }) {
    this.check.next(select);
  }
  onIssueSelect(issue: Issue, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.check.next({ group: this.group, issue, all: false });
  }
  onIssueOpen(issue: Issue, event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.openIssue.next(issue);
  }
  onIssueDragStart(issue: Issue, event: DragEvent) {
    event.dataTransfer?.setData('text/plain', issue.id);
    event.dataTransfer?.setData('application/x-renwu-issue-id', issue.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }
  onDragOver(event: DragEvent) {
    if (event.dataTransfer?.types.includes('application/x-renwu-issue-id')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }
  onDrop(targetGroup: BoardGroup, event: DragEvent) {
    event.preventDefault();
    const issueId =
      event.dataTransfer?.getData('application/x-renwu-issue-id') ||
      event.dataTransfer?.getData('text/plain');
    if (issueId && targetGroup?.issue) {
      this.issueDrop.next({ issueId, targetGroup });
    }
  }
  onGroupSelect(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const issue = this.group.items[0];
    if (issue) {
      this.check.next({ group: this.group, issue, all: true });
    }
  }
  isIssueSelected(issue: Issue): boolean {
    return !!(issue as IssueBoardUi).__is_selected;
  }
  onAddTask(group: BoardGroup) {
    this.addTask.next(group);
  }
  onIssueDrop(event: { issueId: string; targetGroup: BoardGroup }) {
    this.issueDrop.next(event);
  }
  onOpenIssue(issue: Issue) {
    this.openIssue.next(issue);
  }
  collapse() {
    const openIndexGroup = this.settingsService.user.settings.open_index_group;
    openIndexGroup[this.group.uid] = !openIndexGroup[this.group.uid];
    this.cd.markForCheck();
    this.settingsService.user.settings.open_index_group = openIndexGroup;
  }

  isCardLayoutView(viewId: string | undefined): boolean {
    return (
      viewId === 'cards-v' ||
      viewId === 'cards-h' ||
      viewId === 'cards-hw'
    );
  }
}
