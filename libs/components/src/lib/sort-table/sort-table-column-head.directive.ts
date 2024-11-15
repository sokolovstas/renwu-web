import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RwSortTableDirective } from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableColumnHead]',
  standalone: true,
})
export class RwSortTableColumnHeadDirective implements OnInit, OnDestroy {
  @HostBinding('class.rw-sorttablecolumnhead')
  classbind = true;

  @Input()
  rwSortTableColumnHead: string;

  @HostBinding('style')
  style: Record<string, string | number>;

  get columnId(): string {
    return this.sortTable.rwSortTable + ':' + this.rwSortTableColumnHead;
  }

  drag = false;
  hidden = false;

  prevScreenX = 0;
  moveGlobal: () => void;
  upGlobal: () => void;

  constructor(
    public el: ElementRef,
    private sortTableService: RwSortTableService,
    private sortTable: RwSortTableDirective,
  ) {}

  ngOnInit(): void {
    this.sortTableService.registerColumnHead(this.columnId, this);
  }
  ngOnDestroy(): void {
    this.sortTableService.unregisterColumnHead(this.columnId);
  }

  // // Set flex basis from service
  // setFlexBasisHead(flexBasis: string): void {
  //   (this.el.nativeElement as HTMLElement).style.flexBasis = flexBasis + '%';
  // }

  getWidth(): number {
    return (this.el.nativeElement as HTMLElement).offsetWidth;
  }

  hide(): void {
    this.hidden = true;
    (this.el.nativeElement as HTMLDivElement).style.display = 'none';
  }
  show(): void {
    this.hidden = false;
    (this.el.nativeElement as HTMLDivElement).style.display = '';
  }
}
