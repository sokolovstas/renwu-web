
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, HostListener, Input, Output, QueryList, ViewChildren, ViewEncapsulation, inject } from '@angular/core';
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
  selectedCount = 0;

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

  @HostBinding('class.collapsed-column')
  get collapsedColumn(): boolean {
    return (
      this.collapsed && this.parentGroup?.config?.view?.id === 'columns'
    );
  }

  @HostBinding('class.collapsed-row')
  get collapsedRow(): boolean {
    return this.collapsed && this.parentGroup?.config?.view?.id === 'rows';
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

  @HostBinding('class.renwu-board-group--drop-target')
  dropTargetActive = false;

  private dragEnterCount = 0;

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
    const host = event.currentTarget as HTMLElement | null;
    const multi =
      this.isIssueSelected(issue) && this.selectedCount > 1
        ? this.selectedCount
        : 1;
    event.dataTransfer?.setData('text/plain', issue.id);
    event.dataTransfer?.setData('application/x-renwu-issue-id', issue.id);
    event.dataTransfer?.setData(
      'application/x-renwu-issue-multi',
      String(multi),
    );
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    if (host && event.dataTransfer) {
      this.setDragPreview(host, multi, event);
    }
    host?.classList.add('renwu-board-group__issue--dragging');
  }
  onIssueDragEnd(event: DragEvent) {
    const host = event.currentTarget as HTMLElement | null;
    host?.classList.remove('renwu-board-group__issue--dragging');
    this.clearDragPreview();
    this.clearDropTarget();
  }
  onDragEnter(event: DragEvent) {
    if (!this.isIssueDrag(event) || !this.canAcceptDrop()) {
      return;
    }
    event.preventDefault();
    this.dragEnterCount += 1;
    if (!this.dropTargetActive) {
      this.dropTargetActive = true;
      this.cd.markForCheck();
    }
  }
  onDragOver(event: DragEvent) {
    if (!this.isIssueDrag(event) || !this.canAcceptDrop()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (!this.dropTargetActive) {
      this.dropTargetActive = true;
      this.cd.markForCheck();
    }
  }
  onDragLeave(event: DragEvent) {
    if (!this.isIssueDrag(event)) {
      return;
    }
    this.dragEnterCount = Math.max(0, this.dragEnterCount - 1);
    if (this.dragEnterCount === 0 && this.dropTargetActive) {
      this.dropTargetActive = false;
      this.cd.markForCheck();
    }
  }
  onDrop(targetGroup: BoardGroup, event: DragEvent) {
    event.preventDefault();
    this.clearDropTarget();
    const issueId =
      event.dataTransfer?.getData('application/x-renwu-issue-id') ||
      event.dataTransfer?.getData('text/plain');
    if (issueId && targetGroup?.issue) {
      this.issueDrop.next({ issueId, targetGroup });
    }
  }

  @HostListener('document:dragend')
  onDocumentDragEnd(): void {
    this.clearDropTarget();
  }

  private isIssueDrag(event: DragEvent): boolean {
    return !!event.dataTransfer?.types?.includes('application/x-renwu-issue-id');
  }

  private canAcceptDrop(): boolean {
    return !!this.group?.issue && this.group.groups.length === 0;
  }

  private clearDropTarget(): void {
    this.dragEnterCount = 0;
    if (this.dropTargetActive) {
      this.dropTargetActive = false;
      this.cd.markForCheck();
    }
  }

  private dragPreviewEl: HTMLElement | null = null;

  private setDragPreview(
    host: HTMLElement,
    count: number,
    event: DragEvent,
  ): void {
    this.clearDragPreview();
    const card =
      (host.querySelector('renwu-boards-card') as HTMLElement | null) ?? host;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const preview = document.createElement('div');
    preview.className = 'renwu-board-drag-preview';
    preview.style.width = `${width + Math.min(count - 1, 2) * 4}px`;
    preview.style.height = `${height + Math.min(count - 1, 2) * 4}px`;

    const stack = document.createElement('div');
    stack.className = 'renwu-board-drag-preview__stack';
    stack.style.width = `${width}px`;
    stack.style.height = `${height}px`;

    const layers = Math.min(count, 3);
    for (let i = layers - 1; i >= 1; i--) {
      const layer = document.createElement('div');
      layer.className = 'renwu-board-drag-preview__layer';
      layer.style.width = `${width}px`;
      layer.style.height = `${height}px`;
      layer.style.transform = `translate(${i * 4}px, ${i * 4}px)`;
      stack.appendChild(layer);
    }

    const front = document.createElement('div');
    front.className =
      'renwu-board-drag-preview__layer renwu-board-drag-preview__layer--front';
    front.style.width = `${width}px`;
    front.style.height = `${height}px`;
    front.appendChild(card.cloneNode(true));
    stack.appendChild(front);
    preview.appendChild(stack);

    if (count > 1) {
      const badge = document.createElement('div');
      badge.className = 'renwu-board-drag-preview__badge';
      badge.textContent = String(count);
      preview.appendChild(badge);
    }

    document.body.appendChild(preview);
    this.dragPreviewEl = preview;
    const rect = host.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(event.clientX - rect.left, width));
    const offsetY = Math.max(0, Math.min(event.clientY - rect.top, height));
    event.dataTransfer?.setDragImage(preview, offsetX, offsetY);
  }

  private clearDragPreview(): void {
    this.dragPreviewEl?.remove();
    this.dragPreviewEl = null;
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
