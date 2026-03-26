/* eslint-disable @angular-eslint/directive-selector */
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[renwu-timeline-holder]',
  standalone: true,
})
export class TimelineHolderDirective {
  @Input()
  timelineHolder: string | null = null;

  @Output()
  dragStart = new EventEmitter<void>();

  @Output()
  dragDelta = new EventEmitter<number>();

  @Output()
  dragEnd = new EventEmitter<void>();

  private dragging = false;
  private prevScreenX = 0;
  private moveGlobal: (() => void) | null = null;
  private upGlobal: (() => void) | null = null;
  private dragTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  @HostListener('mousedown', ['$event.layerX', '$event.screenX', '$event.which'])
  onMouseDown(layerX: number, screenX: number, which: number): boolean {
    if (which === 3) {
      // Disable right click drag
      return false;
    }

    void layerX;
    this.dragging = true;
    this.prevScreenX = screenX;

    this.dragTimeout = setTimeout(() => {
      this.dragStart.next();
      this.dragging = true;
      this.el.nativeElement.style.cursor = 'move';
    }, 200);

    this.moveGlobal = this.renderer.listen(
      'window',
      'mousemove',
      (event: MouseEvent) => {
        const deltaX = this.prevScreenX - event.screenX;
        this.prevScreenX = event.screenX;
        if (this.dragging) {
          this.el.nativeElement.style.cursor = 'move';
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

    return true;
  }
}

