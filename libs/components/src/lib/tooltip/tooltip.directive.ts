import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Type,
} from '@angular/core';
import { Placement } from '@floating-ui/dom';
import { RwTooltipService, Tooltip } from './tooltip.service';
import { RwTooltipComponent } from './tooltip/tooltip.component';

@Directive({
  selector: '[rwTooltip]',
  standalone: true,
})
export class RwTooltipDirective implements OnDestroy {
  showTimeout = -1;
  floatingCleanup: () => void;

  @Input()
  set rwTooltip(value: string) {
    this._rwTooltip = value;
    if (this.tooltip && !this.tooltipType) {
      (this.tooltip.componentRef.instance as RwTooltipComponent)['text'] =
        value;
      setTimeout(() => {
        this.place();
      });
    }
  }

  get rwTooltip(): string {
    return this._rwTooltip;
  }
  _rwTooltip: string;

  @Input()
  set tooltipDisabled(value: boolean) {
    this._tooltipDisabled = value;
    if (value) {
      if (this.tooltip) {
        clearTimeout(this.showTimeout);
        this.tooltipService.remove(this.tooltip);
      }
    }
  }
  get tooltipDisabled(): boolean {
    return this._tooltipDisabled;
  }
  _tooltipDisabled = false;

  @Input()
  tooltipPlacement: Placement = 'top';

  @Input()
  tooltipType: Type<unknown>;

  @Input()
  tooltipHideBack = false;

  @Input()
  tooltipData: unknown;

  @Input()
  tooltipTimeout = 500;

  @Input()
  tooltipWidth: string;

  @Input()
  tooltipMaxWidth: string;

  @Input()
  textAlign: string;

  tooltip: Tooltip<RwTooltipComponent | unknown>;

  @Input()
  tooltipPadding = 7;

  @Input()
  tooltipDataField = 'data';

  constructor(
    private tooltipService: RwTooltipService,
    private el: ElementRef,
  ) {}

  @HostListener('mouseenter') onMouseEnter(): void {
    if (!this.tooltipType && (!this.rwTooltip || !this.rwTooltip.trim())) {
      return;
    }
    clearTimeout(this.showTimeout);
    if (this.tooltip) {
      this.tooltipService.remove(this.tooltip);
    }
    this.showTimeout = globalThis.setTimeout(() => {
      if (this.tooltipDisabled) {
        return;
      }
      if (!this.tooltipType) {
        this.tooltip = this.tooltipService.add(
          this.rwTooltip,
          this.tooltipWidth,
          this.tooltipMaxWidth,
        );
      } else {
        this.tooltip = this.tooltipService.addWithType(
          this.tooltipType,
          this.tooltipData,
        );
      }
      if (!this.tooltip) {
        return;
      }
      globalThis.setTimeout(() => {
        this.place();
      });
    }, this.tooltipTimeout);
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    clearTimeout(this.showTimeout);
    if (this.tooltip) {
      this.tooltipService.remove(this.tooltip);
    }
  }
  @HostListener('mousedown') onMouseDown(): void {
    clearTimeout(this.showTimeout);
    if (this.tooltip) {
      this.tooltipService.remove(this.tooltip);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.showTimeout);
    if (this.tooltip) {
      this.tooltipService.remove(this.tooltip);
    }
  }

  place(): void {
    if (!this.tooltip) {
      return;
    }
    this.tooltipService.place(this.tooltip, this.el.nativeElement);
  }
}
