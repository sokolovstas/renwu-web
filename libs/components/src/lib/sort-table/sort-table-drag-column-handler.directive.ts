import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
} from '@angular/core';
import { RwSortTableDragColumnDirective } from './sort-table-drag-column.directive';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableDragColumnHandler]',
  standalone: true,
})
export class RwSortTableDragColumnHandlerDirective {
  @HostBinding('class.rw-sorttablecolumnhandler')
  classbind = true;

  @Input('rwSortTableDragColumnHandler') sortTableDragColumnHandler: number; // eslint-disable-line  @angular-eslint/no-input-rename

  @Input()
  canSort = true;

  constructor(
    private el: ElementRef,
    private sortTableService: RwSortTableService,
    private sortTableDragColumn: RwSortTableDragColumnDirective,
    private sortTable: RwSortTableDirective,
  ) {}
  @HostListener('mousedown', ['$event.which']) onMouseDown(
    which: number,
  ): void {
    if (!this.canSort) {
      return;
    }
    if (which === 3) {
      // disable right click drag
      return;
    }
    this.sortTableService.startDrag(
      this.sortTable.rwSortTable,
      this.sortTableDragColumn.index,
    );
  }
}
