
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RwIconComponent,
  RwTextInputComponent,
  RwTextWithTooltipComponent,
  RwTooltipDirective,
} from '@renwu/components';
import { ListOptions, SortFields } from '../../search/sort.model';

@Component({
  selector: 'renwu-issue-table-header-column',
  standalone: true,
  imports: [
    RwIconComponent,
    RwTextInputComponent,
    FormsModule,
    RwTooltipDirective,
    RwTextWithTooltipComponent
],
  templateUrl: './header-column.component.html',
  styleUrl: './header-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderColumnComponent {
  cd = inject(ChangeDetectorRef);

  @Input()
  key: string;

  @Input()
  label: string;

  @Input()
  groupable: boolean;

  @Input()
  sortable: boolean;

  @Input()
  filterable: boolean;

  @Output()
  listOptionsChange = new EventEmitter<ListOptions>();

  @Input()
  listOptions: ListOptions = new ListOptions();

  @HostListener('click')
  onclick() {
    this.sortColumn(this.key);
  }
  sortColumn(columnName: string) {
    if (!this.sortable) {
      return;
    }
    if (this.listOptions.sort.field !== columnName) {
      this.listOptions.sort.direction = undefined;
    }
    this.listOptions.sort.field = columnName as SortFields;
    this.changeSortDirection();
  }
  changeSortDirection() {
    if (!this.listOptions.sort.direction) {
      this.listOptions.sort.direction = 'up';
    } else if (this.listOptions.sort.direction === 'up') {
      this.listOptions.sort.direction = 'down';
    } else {
      this.listOptions.sort.direction = undefined;
      this.listOptions.sort.field = undefined;
    }
    this.changeFilter();
  }
  onGroup(groupField: string, event: MouseEvent) {
    event.stopImmediatePropagation();
    this.listOptions.group = Object.assign(this.listOptions.group || {}, {
      field: groupField,
    });
    this.changeFilter();
  }
  changeFilter() {
    this.listOptionsChange.next({ ...this.listOptions });
    this.cd.markForCheck();
  }
}
