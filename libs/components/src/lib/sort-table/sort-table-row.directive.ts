import {
  AfterViewInit,
  ContentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  QueryList,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { touchAndMouseEnd, touchAndMouseMove } from '@renwu/utils';
import { takeUntil } from 'rxjs';
import { RwSortTableColumnDirective } from './sort-table-column.directive';
import {
  RwSortTableDirective,
  SortCompletedEvent,
  SortMoveEvent,
  SortStartEvent,
} from './sort-table.directive';
import { RwSortTableService } from './sort-table.service';

@Directive({
  selector: '[rwSortTableRow]',
  standalone: true,
})
export class RwSortTableRowDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private destroy = inject(DestroyRef);
  private sortTableService = inject(RwSortTableService);
  private sortTable = inject(RwSortTableDirective);

  @ContentChildren(RwSortTableColumnDirective)
  cols: QueryList<RwSortTableColumnDirective>;

  @HostBinding('class.rw-sorttablerow')
  classbind = true;

  @Output()
  sortMove: EventEmitter<SortMoveEvent> = new EventEmitter<SortMoveEvent>();
  @Output()
  sortStart: EventEmitter<SortStartEvent> = new EventEmitter<SortStartEvent>();
  @Output()
  sortCompleted: EventEmitter<SortCompletedEvent> =
    new EventEmitter<SortCompletedEvent>();

  drag: boolean;
  offsetHeight: number;
  offsetTop: number;
  offsetWidth: number;
  offsetLeft: number;
  newIndex: number;
  _index: number;
  moveHandlerDrag: () => void;

  @Input('rwSortTableRow')
  set index(value: number) {
    if (this._index) {
      this.sortTableService.unregisterRow(
        this.sortTable.rwSortTable,
        this.index,
      );
    }
    this._index = value;
    this.newIndex = value;
    if (value !== undefined) {
      globalThis.setTimeout(() => {
        this.sortTableService.registerRow(
          this.sortTable.rwSortTable,
          this.index,
          this,
        );
      });
    }
  }
  get index(): number {
    return this._index;
  }
  ngAfterViewInit(): void {
    return;
  }
  ngOnDestroy(): void {
    this.sortTableService.unregisterRow(this.sortTable.rwSortTable, this.index);
  }
  startSorting(): void {
    (this.el.nativeElement as HTMLElement).classList.add(
      'rw-sorttablerow-move',
    );
    const bounds = (
      this.el.nativeElement as HTMLElement
    ).getBoundingClientRect();
    touchAndMouseMove(window)
      .pipe(
        takeUntil(touchAndMouseEnd(window)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(({ x, y }) => {
        if (y > bounds.top && y < bounds.bottom) {
          this.sortTableService.moveOther(
            this.sortTable.rwSortTable,
            this.index,
            y - bounds.top,
          );
        }
      });
  }
  stopSorting(): void {
    (this.el.nativeElement as HTMLElement).classList.remove(
      'rw-sorttablerow-move',
    );
    (this.el.nativeElement as HTMLElement).style.transform =
      'translate3d(0px, 0px, 0px)';
  }
  startDrag(): void {
    this.drag = true;
    this.offsetHeight = (this.el.nativeElement as HTMLElement).offsetHeight;
    this.offsetTop = (
      this.el.nativeElement as HTMLElement
    ).getBoundingClientRect().top;
    this.newIndex = this.index;
    (this.el.nativeElement as HTMLElement).classList.add(
      'rw-sorttablerow-drag',
    );
    this.sortStart.next(new SortStartEvent(this.index, this));
  }
  // Used to move another objects in collection
  offsetDrag(offset: number): void {
    if (this.drag) {
      return;
    }
    (
      this.el.nativeElement as HTMLElement
    ).style.transform = `translate3d(0px, ${offset}px, 0px)`;
  }
  // Used to move current drag object
  moveDrag(offsetX: number, offsetY: number): void {
    this.sortMove.next(
      new SortMoveEvent(offsetX, offsetY, this.newIndex, this),
    );
    (
      this.el.nativeElement as HTMLElement
    ).style.transform = `translate3d(0px, ${offsetY}px, 0px)`;
  }
  stopDrag(): void {
    this.drag = false;
    (this.el.nativeElement as HTMLElement).classList.remove(
      'rw-sorttablerow-drag',
    );
    this.sortCompleted.next(new SortCompletedEvent(this.index, this.newIndex));
  }
  getHeight(): number {
    return (this.el.nativeElement as HTMLElement).offsetHeight;
  }
}
