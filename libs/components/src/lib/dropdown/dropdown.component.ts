import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  TemplateRef,
} from '@angular/core';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { NgTemplateOutlet } from '@angular/common';
import { JSONUtils } from '@renwu/utils';

import {
  Placement,
  autoUpdate,
  computePosition,
  flip,
  offset,
} from '@floating-ui/dom';

@Component({
  selector: 'rw-dropdown',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  animations: [
    trigger('opacityAnim', [
      state(
        'show',
        style({
          opacity: 1,
        }),
      ),
      state(
        'void',
        style({
          opacity: 0,
        }),
      ),

      transition('void => show', animate('150ms ease-out')),
      transition('show => void', animate('150ms ease-out')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwDropDownComponent implements OnDestroy {
  @ContentChild('dropdownContent', { static: true })
  dropdownContent: TemplateRef<unknown>;

  @HostBinding('style.left.px')
  left: number;
  @HostBinding('style.top.px')
  top: number;

  @HostBinding('style.width.px')
  width: number;
  @HostBinding('style.height.px')
  height: number;

  @HostBinding('style.max-height.px')
  maxHeight: number;
  @HostBinding('style.min-width.px')
  minWidth: number;

  @HostBinding('style.display')
  display = 'none';

  @HostBinding('style.flex-direction')
  flexDirection = 'column';

  /**
   * Element that will use for dropdown position
   */
  @Input()
  bindElement: HTMLElement;

  /**
   * Element that will open/close dropdown
   */
  @Input()
  set activeElement(value: HTMLElement) {
    this._activeElement = value;
    this.setListeners();
  }
  get activeElement(): HTMLElement {
    return this._activeElement;
  }

  _activeElement: HTMLElement;

  /**
   * Set dropdown width to bind element width
   */
  @Input()
  useBindWidth: boolean;

  /**
   * Set dropdown min width to bind element width
   */
  @Input()
  useBindWidthMin: boolean;

  @Input()
  placement: Placement;

  finalPlacement: Placement;

  @Input()
  inside: boolean;

  @Input()
  absolute = true;

  @Input()
  mouseover = false;

  @Input()
  set position(value: DropDownPosition) {
    if (!value) {
      return;
    }
    if (JSONUtils.jsonCompare(this.__position, value)) {
      return;
    }
    this.__position = value;
    this.calculateBounds();
  }
  get position(): DropDownPosition {
    return this.__position;
  }
  __position: DropDownPosition;

  @Input()
  closeByClickActiveElement: boolean;

  @Input()
  displayBackground: boolean;

  @Input()
  closeByClickElement = true;

  @Output()
  displayed = new EventEmitter<void>();

  @Output()
  closed = new EventEmitter<boolean>();

  state = 'void';

  dropDownNgIf = false;

  openHandler: () => void;

  floatingCleanup: () => void;

  calculateTimeout: number;

  appendTimeout: number;

  dropDownTimeout: number;

  leaveDropdownHandler: () => void;

  enterDropdownHandler: () => void;

  leaveActiveHandler: () => void;

  clickDropdownHandler: () => void;

  leaveActiveHandlerByClickActiveElement: () => void;

  parent: HTMLElement;

  constructor(
    public el: ElementRef,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
  ) {}

  setListeners(): void {
    if (this.openHandler) {
      this.openHandler();
    }
    if (this.activeElement) {
      this.dropDownNgIf = false;
      if (this.mouseover) {
        this.openHandler = this.renderer.listen(
          this.activeElement,
          'mouseover',
          () => {
            this.openDropdownByClick();
          },
        );
      } else {
        this.openHandler = this.renderer.listen(
          this.activeElement,
          'mouseup',
          (moveEvent: MouseEvent) => {
            if (!this.dropDownNgIf) {
              moveEvent.stopImmediatePropagation();
              this.openDropdownByClick();
            }
          },
        );
      }
    } else {
      // this.dropDownNgIf = true;
      // this.calculateBounds();
    }
    this.cd.markForCheck();
  }

  openDropdownByClick(): void {
    this.dropDownNgIf = true;
    this.calculateBounds();
    globalThis.setTimeout(() => {
      if (!this.displayBackground) {
        this.addLeaveDropdownHandler();
      }
      this.addEnterDropDownHandler();
      if (!this.displayBackground) {
        this.addLeaveActiveHandler();
      }
    }, 100);
    if (this.closeByClickElement) {
      this.addClickDropdownHandler();
    }
    if (this.closeByClickActiveElement) {
      this.addLeaveActiveHandlerByClickActiveElement();
    }
    this.cd.markForCheck();
  }

  openDropdown(): void {
    if (!this.dropDownNgIf) {
      this.dropDownNgIf = true;
      this.calculateBounds();
      this.cd.markForCheck();
    }
  }

  closeDropdown(): void {
    if (this.state === 'void') {
      return;
    }
    this.setState('void');

    if (this.leaveDropdownHandler) {
      this.leaveDropdownHandler();
    }
    if (this.enterDropdownHandler) {
      this.enterDropdownHandler();
    }
    if (this.leaveActiveHandler) {
      this.leaveActiveHandler();
    }
    if (this.clickDropdownHandler) {
      this.clickDropdownHandler();
    }
    if (this.leaveActiveHandlerByClickActiveElement) {
      this.leaveActiveHandlerByClickActiveElement();
    }
    globalThis.setTimeout(() => {
      if (this.absolute) {
        this.parent.appendChild(this.el.nativeElement);
      }
      this.display = 'none';
      if (this.closed) {
        this.closed.next(true);
      }
      this.dropDownNgIf = false;
      this.cd.markForCheck();
    }, 150);
  }

  addLeaveDropdownHandler(): void {
    this.leaveDropdownHandler = this.renderer.listen(
      this.el.nativeElement,
      'mouseleave',
      () => {
        this.closeDropdown();
      },
    );
  }

  addEnterDropDownHandler(): void {
    this.enterDropdownHandler = this.renderer.listen(
      this.el.nativeElement,
      'mouseenter',
      () => {
        this.dropDownNgIf = true;
        clearTimeout(this.dropDownTimeout);
        this.enterDropdownHandler();
        this.cd.markForCheck();
      },
    );
  }

  addLeaveActiveHandler(): void {
    this.leaveActiveHandler = this.renderer.listen(
      this.activeElement,
      'mouseleave',
      () => {
        this.leaveActiveHandler();
        this.dropDownTimeout = globalThis.setTimeout(() => {
          this.closeDropdown();
          this.enterDropdownHandler();
        }, 100);
      },
    );
  }

  addClickDropdownHandler(): void {
    this.clickDropdownHandler = this.renderer.listen(
      this.el.nativeElement,
      'mouseup',
      () => {
        this.closeDropdown();
      },
    );
  }

  addLeaveActiveHandlerByClickActiveElement(): void {
    this.leaveActiveHandlerByClickActiveElement = this.renderer.listen(
      this.activeElement,
      'mouseup',
      () => {
        this.closeDropdown();
        this.enterDropdownHandler();
        if (this.leaveActiveHandler) {
          this.leaveActiveHandler();
        }
      },
    );
  }

  setState(newState: string): void {
    this.state = newState;
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.parent) {
      this.parent.appendChild(this.el.nativeElement);
    }
    clearTimeout(this.calculateTimeout);
    clearTimeout(this.appendTimeout);
    this.state = 'void';
    this.display = 'none';
    this.dropDownNgIf = false;
    this.cd.markForCheck();
    if (this.openHandler) {
      this.openHandler();
    }
    if (this.leaveDropdownHandler) {
      this.leaveDropdownHandler();
    }
    if (this.enterDropdownHandler) {
      this.enterDropdownHandler();
    }
    if (this.leaveActiveHandler) {
      this.leaveActiveHandler();
    }
    if (this.clickDropdownHandler) {
      this.clickDropdownHandler();
    }
    if (this.leaveActiveHandlerByClickActiveElement) {
      this.leaveActiveHandlerByClickActiveElement();
    }
    if (this.floatingCleanup) {
      this.floatingCleanup();
    }
    this.bindElement = null;
    this.activeElement = null;
    this.displayed.complete();
    this.closed.complete();
  }

  async calculateBounds(): Promise<void> {
    if (!this.bindElement) {
      return;
    }
    const parent = (this.el.nativeElement as HTMLElement).parentElement;
    if (parent.tagName !== 'BODY') {
      this.parent = (this.el.nativeElement as HTMLElement).parentElement;
    }

    this.setState('void');
    this.display = 'flex';
    this.flexDirection = 'column';

    this.top = undefined;
    this.left = undefined;

    const bindWidth: number = this.bindElement.offsetWidth;

    if (this.useBindWidth) {
      this.width = bindWidth;
    }

    if (this.useBindWidthMin) {
      this.minWidth = bindWidth;
    }

    const compute = () => {
      return computePosition(this.bindElement, this.el.nativeElement, {
        placement: this.placement,
        middleware: [
          offset(({ rects }) => {
            if (this.inside) {
              return -rects.reference.height;
            }
            return 0;
          }),
          flip(),
        ],
      }).then(({ x, y, placement }) => {
        this.finalPlacement = placement;
        this.left = x;
        this.top = y;

        this.cd.markForCheck();
      });
    };

    this.floatingCleanup = autoUpdate(
      this.bindElement,
      this.el.nativeElement,
      compute,
    );

    this.displayed.next();

    this.cd.detectChanges();
    compute();

    setTimeout(() => {
      compute();
      this.setState('show');
    }, 50);
  }
  public show(): void {
    this.openDropdown();
  }
  public hide(): void {
    this.closeDropdown();
  }
}
export interface DropDownPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  height?: number;
  width?: number;
}
