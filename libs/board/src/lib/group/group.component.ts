
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwIconComponent,
  RwTooltipDirective,
} from '@renwu/components';
import { Issue, RwSettingsService } from '@renwu/core';
import { BoardGroup, BoardGroupsConfig } from '../board.model';
import { CardComponent } from '../card/card.component';
import { SortListPipe } from '../sort-list/sort-list.pipe';
import { RwGroupService } from './group.service';

@Component({
  selector: 'renwu-board-group',
  standalone: true,
  imports: [
    RwTooltipDirective,
    SortListPipe,
    RwIconComponent,
    RwButtonComponent,
    CardComponent,
    TranslocoPipe
],
  providers: [RwGroupService],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BoardGroupComponent {
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
      collapsed = !!openIndexGroup[this.group.uid] && !this.groupOnly;
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

  @Output()
  check = new EventEmitter<{
    group: BoardGroup;
    issue: Issue;
    all: boolean;
  }>();

  @Output()
  addTask = new EventEmitter<BoardGroup>();

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

  constructor(
    private cd: ChangeDetectorRef,
    private settingsService: RwSettingsService,
  ) {}

  markForCheck() {
    this.cd.markForCheck();
    this.groups.forEach((group) => {
      group.markForCheck();
    });
  }

  onIssueCheck(select: { group: BoardGroup; issue: Issue; all: boolean }) {
    this.check.next(select);
  }
  onAddTask(group: BoardGroup) {
    this.addTask.next(group);
  }
  collapse() {
    const openIndexGroup = this.settingsService.user.settings.open_index_group;
    openIndexGroup[this.group.uid] = !openIndexGroup[this.group.uid];
    this.cd.markForCheck();
    this.settingsService.user.settings.open_index_group = openIndexGroup;
  }
}
