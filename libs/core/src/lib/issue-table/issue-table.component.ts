
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwDatePipe,
  RwDurationToStringPipe,
  RwModalService,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';
import { AvatarComponent } from '../avatar/avatar.component';
import { IssueAssigneesComponent } from '../issue/fields/assignees/assignees.component';
import { IssueMilestonesComponent } from '../issue/fields/milestones/milestones.component';
import { IssuePriorityComponent } from '../issue/fields/priority/priority.component';
import { IssueStatusComponent } from '../issue/fields/status/status.component';
import { IssueTypeComponent } from '../issue/fields/type/type.component';
import { Issue } from '../issue/issue.model';
import { ListOptions } from '../search/sort.model';
import { RwFormatUserPipe } from '../user/format-user-pipe/format-user.pipe';
import { HeaderColumnComponent } from './header-column/header-column.component';
import { ListExporterComponent } from './list-exporter/list-exporter.component';

@Component({
  selector: 'renwu-issue-table',
  standalone: true,
  imports: [
    RouterLink,
    HeaderColumnComponent,
    RwSortTableRowDirective,
    RwSortTableDirective,
    RwSortTableColumnHeadDirective,
    RwSortTableColumnDirective,
    IssueStatusComponent,
    IssuePriorityComponent,
    IssueTypeComponent,
    RwDurationToStringPipe,
    IssueAssigneesComponent,
    IssueMilestonesComponent,
    RwDatePipe,
    RwButtonComponent,
    AvatarComponent,
    TranslocoPipe,
    RwFormatUserPipe
],
  templateUrl: './issue-table.component.html',
  styleUrl: './issue-table.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwIssueTableComponent {
  modal = inject(RwModalService);

  @Input()
  issues: Issue[];

  @Input()
  groupable: boolean;

  @Input()
  sortable: boolean;

  @Input()
  fixedHeader: boolean;

  @Input()
  showExport = false;

  @Output()
  clicked = new EventEmitter<Issue>();

  @Output()
  listOptionsChange = new EventEmitter<ListOptions>();

  @Input()
  listOptions: ListOptions = new ListOptions();

  updateListOptions(value: ListOptions) {
    this.listOptionsChange.next({ ...this.listOptions, ...value });
  }
  openExporter() {
    const modal = this.modal.add(ListExporterComponent, {});
    modal.list = this.issues;
  }
}
