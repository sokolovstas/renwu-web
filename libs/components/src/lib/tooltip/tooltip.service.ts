import { ComponentRef, ElementRef, Injectable, Type } from '@angular/core';
import {
  Placement,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { RwTooltipContainerComponent } from './tooltip-container/tooltip-container.component';
import { RwTooltipComponent } from './tooltip/tooltip.component';

export class Tooltip<T> {
  floatingCleanup: () => void;
  componentRef: ComponentRef<T>;

  constructor(componentRef: ComponentRef<T>) {
    this.componentRef = componentRef;
  }
}

@Injectable({
  providedIn: 'root',
})
export class RwTooltipService {
  tooltips: Tooltip<unknown>[];
  container: RwTooltipContainerComponent;

  constructor() {
    this.tooltips = [];
  }
  registerContainer(container: RwTooltipContainerComponent): void {
    this.container = container;
  }
  add(
    text = '',
    width = 'auto',
    maxWidth = '',
    hideBack = false,
  ): Tooltip<RwTooltipComponent> {
    if (!this.container) {
      return null;
    }
    const componentRef =
      this.container.target.createComponent(RwTooltipComponent);

    const tooltip = new Tooltip(componentRef);

    this.tooltips.push(tooltip);

    componentRef.instance['text'] = text;
    componentRef.instance['hideBack'] = hideBack;
    if (width === 'auto') {
      componentRef.instance['whitespace'] = 'nowrap';
      componentRef.instance['width'] = 'auto';
    } else {
      componentRef.instance['whitespace'] = 'wrap';
      componentRef.instance['width'] = width;
    }
    if (maxWidth) {
      componentRef.instance['maxWidth'] = maxWidth;
      componentRef.instance['whitespace'] = 'wrap';
    }

    return tooltip;
  }
  place(
    tooltip: Tooltip<unknown>,
    element: HTMLElement,
    options?: { placements?: Placement },
  ) {
    const compute = async () => {
      const { x, y } = await computePosition(
        element,
        tooltip.componentRef.location.nativeElement,
        {
          placement: options?.placements,
          middleware: [offset({ mainAxis: 10 }), flip(), shift()],
        },
      );

      (
        tooltip.componentRef.injector.get(ElementRef)
          .nativeElement as HTMLElement
      ).style.left = `${x}px`;
      (
        tooltip.componentRef.injector.get(ElementRef)
          .nativeElement as HTMLElement
      ).style.top = `${y}px`;
    };

    tooltip.floatingCleanup = autoUpdate(
      element,
      tooltip.componentRef.location.nativeElement,
      compute,
    );
  }
  addWithType<T>(
    contentType: Type<T>,
    data: { [P in keyof T]?: T[P] },
  ): Tooltip<T> {
    const componentRef = this.container.target.createComponent(contentType);

    const tooltip = new Tooltip(componentRef);
    this.tooltips.push(tooltip);

    for (const k in data) {
      componentRef.instance[k] = data[k];
    }

    return tooltip;
  }
  remove(tooltip: Tooltip<unknown>): void {
    const index = this.tooltips.indexOf(tooltip);
    if (index > -1) {
      this.tooltips.splice(index, 1);
    }
    if (tooltip.floatingCleanup) {
      tooltip.floatingCleanup();
    }
    tooltip.componentRef.destroy();
  }
  removeAll(): void {
    this.tooltips.forEach((t) => this.remove(t));
  }
}
