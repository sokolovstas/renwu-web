import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  touchAndMouseEnd,
  touchAndMouseMove,
  touchAndMouseStart,
} from '@renwu/utils';
import { repeat, switchMap, takeUntil, tap } from 'rxjs';
import { RwSortTableDragColumnDirective } from './sort-table-drag-column.directive';
import { RwSortTableRowDirective } from './sort-table-row.directive';
import { RwSortTableService } from './sort-table.service';

export class SortCompletedEvent {
  oldIndex: number;
  newIndex: number;

  constructor(oldIndex: number, newIndex: number) {
    this.oldIndex = oldIndex;
    this.newIndex = newIndex;
  }
}

export class SortMoveEvent {
  x: number;
  y: number;
  index: number;
  target: RwSortTableRowDirective | RwSortTableDragColumnDirective;

  constructor(
    x: number,
    y: number,
    index?: number,
    target?: RwSortTableRowDirective | RwSortTableDragColumnDirective,
  ) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.target = target;
  }
}

export class SortStartEvent {
  index: number;
  target: RwSortTableRowDirective | RwSortTableDragColumnDirective;

  constructor(
    index: number,
    target: RwSortTableRowDirective | RwSortTableDragColumnDirective,
  ) {
    this.index = index;
    this.target = target;
  }
}

@Directive({
  selector: '[rwSortTable]',
  standalone: true,
  providers: [RwSortTableService],
})
export class RwSortTableDirective implements OnInit, OnDestroy, AfterViewInit {
  private el = inject(ElementRef);
  private destroy = inject(DestroyRef);
  private sortTableService = inject(RwSortTableService);

  @HostBinding('class.rw-sorttable')
  classbind = true;

  @Input()
  rwSortTable: string;

  @Input()
  autohideColumns: boolean;

  @Input()
  sortTableCollection: Array<unknown>;

  @Output()
  sortTableCompleted: EventEmitter<SortCompletedEvent> =
    new EventEmitter<SortCompletedEvent>();

  @Output()
  sortTableMove: EventEmitter<SortMoveEvent> =
    new EventEmitter<SortMoveEvent>();

  dragOffsetX: number;
  dragOffsetY: number;

  resizeObserver: ResizeObserver;

  ngOnInit(): void {
    this.sortTableService.registerCollection(this.rwSortTable, this);

    touchAndMouseStart(this.el.nativeElement)
      .pipe(
        tap((event) => {
          this.dragOffsetX = event.x;
          this.dragOffsetY = event.y;
        }),
        switchMap(() => touchAndMouseMove(window)),
        takeUntil(
          touchAndMouseEnd(window).pipe(
            tap(() => this.sortTableService.stopDrag(this.rwSortTable)),
          ),
        ),
        repeat(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(({ x, y }) => {
        const offsetY = y - this.dragOffsetY;
        const offsetX = x - this.dragOffsetX;
        this.sortTableService.moveDrag(this.rwSortTable, offsetX, offsetY);
        this.sortTableMove.next(new SortMoveEvent(offsetX, offsetY));
      });
  }
  ngAfterViewInit(): void {
    if (this.autohideColumns) {
      this.sortTableService.onResize(this.rwSortTable);
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.sortTableService.onResize(this.rwSortTable);
    });
    this.resizeObserver.observe(this.el.nativeElement);
  }
  ngOnDestroy(): void {
    this.sortTableService.unregisterCollection(this.rwSortTable);
    this.resizeObserver.disconnect;
  }
  setSort(oldIndex: number, newIndex: number): void {
    if (this.sortTableCollection) {
      const dragItem: unknown = this.sortTableCollection.splice(oldIndex, 1)[0];
      this.sortTableCollection.splice(newIndex, 0, dragItem);
    }
    if (oldIndex !== newIndex) {
      this.sortTableCompleted.next(new SortCompletedEvent(oldIndex, newIndex));
    }
  }
  getFontSize() {
    return (
      parseInt(
        window
          .getComputedStyle(this.el.nativeElement as HTMLDivElement)
          .fontSize.replace('px', ''),
      ) || 0
    );
  }
  getWidth() {
    return (this.el.nativeElement as HTMLDivElement).getBoundingClientRect()
      .width;
  }
}
