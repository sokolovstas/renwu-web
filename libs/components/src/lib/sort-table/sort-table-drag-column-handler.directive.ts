import { Directive, ElementRef, HostBinding, HostListener, Input, inject } from '@angular/core';
import { RwSortTableDragColumnDirective } from './sort-table-drag-column.directive';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableDragColumnHandler]',
  standalone: true,
})
export class RwSortTableDragColumnHandlerDirective {
  private el = inject(ElementRef);
  private sortTableService = inject(RwSortTableService);
  private sortTableDragColumn = inject(RwSortTableDragColumnDirective);
  private sortTable = inject(RwSortTableDirective);

  @HostBinding('class.rw-sorttablecolumnhandler')
  classbind = true;

  @Input('rwSortTableDragColumnHandler') sortTableDragColumnHandler: number; // eslint-disable-line  @angular-eslint/no-input-rename

  @Input()
  canSort = true;
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
