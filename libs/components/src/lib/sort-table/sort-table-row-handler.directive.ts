import {
  DestroyRef,
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { touchAndMouseStart } from '@renwu/utils';
import { RwSortTableRowDirective } from './sort-table-row.directive';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableRowHandler]',
  standalone: true,
})
export class RwSortTableRowHandlerDirective implements OnInit {
  private el = inject(ElementRef);
  private destroy = inject(DestroyRef);
  private sortTableService = inject(RwSortTableService);
  private sortTableRow = inject(RwSortTableRowDirective);
  private sortTable = inject(RwSortTableDirective);
  @HostBinding('class.rw-sorttablerowhandler')
  classbind = true;

  @Input('rwSortTableRowHandler') sortTableRowHandler: number; // eslint-disable-line  @angular-eslint/no-input-rename

  @Input()
  canSort = true;

  ngOnInit() {
    touchAndMouseStart(this.el.nativeElement, { preventDefault: true })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        if (!this.canSort) {
          return;
        }
        this.sortTableService.startDrag(
          this.sortTable.rwSortTable,
          this.sortTableRow.index,
        );
      });
  }
}
