/* eslint-disable @angular-eslint/directive-selector */
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[renwu-timeline-itemDrag]',
  standalone: true,
})
export class TimelineItemDragDirective {
  @Input()
  issue: unknown;

  @Output()
  dragStart = new EventEmitter<void>();

  @Output()
  dragDelta = new EventEmitter<number>();

  @Output()
  dragEnd = new EventEmitter<void>();

  dragging = false;
  prevScreenX = 0;
  private moveGlobal: (() => void) | null = null;
  private upGlobal: (() => void) | null = null;
  private dragTimeout: ReturnType<typeof setTimeout> | null = null;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mousemove')
  onMouseMove(): void {
    this.el.nativeElement.style.cursor = 'ew-resize';
  }

  @HostListener('mousedown', ['$event.layerX', '$event.screenX', '$event.which'])
  onMouseDown(layerX: number, screenX: number, which: number): boolean {
    if (which === 3) {
      // Disable right click drag
      return false;
    }

    this.dragging = true;
    this.prevScreenX = screenX;

    this.dragTimeout = setTimeout(() => {
      this.dragStart.next();
      this.dragging = true;
      this.el.nativeElement.style.cursor = 'ew-resize';
    }, 200);

    this.moveGlobal = this.renderer.listen(
      'window',
      'mousemove',
      (event: MouseEvent) => {
        const deltaX = this.prevScreenX - event.screenX;
        this.prevScreenX = event.screenX;
        if (this.dragging) {
          this.dragDelta.next(deltaX);
        }
      },
    );

    this.upGlobal = this.renderer.listen(
      'window',
      'mouseup',
      () => {
        setTimeout(() => {
          this.dragEnd.next();
        }, 200);

        this.dragging = false;
        this.el.nativeElement.style.cursor = 'initial';

        if (this.dragTimeout) {
          clearTimeout(this.dragTimeout);
          this.dragTimeout = null;
        }

        this.moveGlobal?.();
        this.upGlobal?.();
        this.moveGlobal = null;
        this.upGlobal = null;
      },
    );

    void layerX;
    return true;
  }
}

