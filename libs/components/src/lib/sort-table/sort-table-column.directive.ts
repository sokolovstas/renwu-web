import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RwSortTableRowDirective } from './sort-table-row.directive';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableColumn]',
  standalone: true,
})
export class RwSortTableColumnDirective implements OnInit, OnDestroy {
  @HostBinding('class.rw-sorttablecolumn')
  classbind = true;

  @Input()
  rwSortTableColumn: string;

  @Input()
  @HostBinding('class.rw-sorttablecolumnhead')
  header: boolean;

  @HostBinding('style')
  style: Record<string, string | number>;

  get columnId(): string {
    return this.sortTable.rwSortTable + ':' + this.rwSortTableColumn;
  }

  constructor(
    private sortTableService: RwSortTableService,
    private sortTable: RwSortTableDirective,
    private sortTableRow: RwSortTableRowDirective,
    public el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.sortTableService.registerColumn(this.columnId, this);
  }
  ngOnDestroy(): void {
    this.sortTableService.unregisterColumn(
      this.columnId,
      this.sortTableRow.index,
    );
  }

  // ngOnInit(): void {
  //   this.showPriority =
  //     this.settingsService.settings.priorities[this.rwSortTableColumn] ||
  //     99999;
  //   this.flex =
  //     this.flex ??
  //     this.sortTableService.getFlex(':' + this.sortTableColumn);
  // }
  hide(): void {
    (this.el.nativeElement as HTMLDivElement).style.display = 'none';
  }
  show(): void {
    (this.el.nativeElement as HTMLDivElement).style.display = '';
  }
}
