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

/** Canvas pan delta in scroll coordinates (positive = content moves left/up). */
export interface TimelinePanDelta {
  deltaX: number;
  deltaY: number;
}

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
  dragDelta = new EventEmitter<TimelinePanDelta>();

  @Output()
  dragEnd = new EventEmitter<void>();

  private panArmed = false;
  private prevScreenX = 0;
  private prevScreenY = 0;
  private moveGlobal: (() => void) | null = null;
  private upGlobal: (() => void) | null = null;
  private dragTimeout: ReturnType<typeof setTimeout> | null = null;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): boolean {
    if (event.which === 3 || event.button === 2) {
      // Disable right click drag
      return false;
    }

    // Don't steal interactions from bars / controls / table chrome actions.
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        'button, a, input, textarea, select, .bar, .bar-create-btn, .bar-create-actions, .timeline-overlay-corner, .timeline-table-resize, .timeline-table-toggle',
      )
    ) {
      return true;
    }

    this.panArmed = false;
    this.prevScreenX = event.screenX;
    this.prevScreenY = event.screenY;

    this.dragTimeout = setTimeout(() => {
      this.panArmed = true;
      this.dragStart.next();
      this.el.nativeElement.style.cursor = 'grabbing';
    }, 160);

    this.moveGlobal = this.renderer.listen(
      'window',
      'mousemove',
      (moveEvent: MouseEvent) => {
        const deltaX = this.prevScreenX - moveEvent.screenX;
        const deltaY = this.prevScreenY - moveEvent.screenY;
        this.prevScreenX = moveEvent.screenX;
        this.prevScreenY = moveEvent.screenY;
        if (!this.panArmed) return;
        this.el.nativeElement.style.cursor = 'grabbing';
        this.dragDelta.next({ deltaX, deltaY });
      },
    );

    this.upGlobal = this.renderer.listen(
      'window',
      'mouseup',
      () => {
        const wasArmed = this.panArmed;
        this.panArmed = false;
        this.el.nativeElement.style.cursor = '';

        if (this.dragTimeout) {
          clearTimeout(this.dragTimeout);
          this.dragTimeout = null;
        }

        if (wasArmed) {
          this.dragEnd.next();
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
