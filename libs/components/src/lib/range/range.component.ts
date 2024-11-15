import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-range',
  standalone: true,
  templateUrl: './range.component.html',
  styleUrl: './range.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwRangeComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwRangeComponent implements OnInit, ControlValueAccessor {
  onTouchedCallback: () => void = noop;

  onChangeCallback: (_: number) => void = noop;

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Output()
  changed = new EventEmitter<number>();

  @Output()
  enter = new EventEmitter<void>();

  @Output()
  changeEnd = new EventEmitter<void>();

  onModelChanged: Subject<number> = new Subject<number>();

  @Input()
  disabled = false;

  @Input()
  min = 0;

  @Input()
  max = 100;

  @Input()
  step = 1;

  @Input()
  filled: boolean;

  @Input()
  live: boolean;

  @Input()
  liveDebounce = 0;

  value: number;

  dragSlider: boolean;

  drag = false;

  prevScreenX = 0;

  moveGlobal: () => void;

  upGlobal: () => void;

  newValue: number;

  deltaX: number;

  sliderLeft: number;

  sliderOpacity: number;

  widthSliderProcent: number;

  widthParentElement: number;

  @ViewChild('elementSlider', { static: true }) elementSlider: ElementRef;

  writeValue(value: number): void {
    if (value === undefined || value === null) {
      value = 0;
    }
    this.value = this.testAndChangeValue(value);
    this.calcParams();
    this.cd.detectChanges();
  }

  registerOnChange(fn: (_: number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.onModelChanged
      .pipe(
        debounceTime(this.liveDebounce), // wait 300ms after the last event before emitting last event
        distinctUntilChanged(), // only emit if value is different from previous value
      )
      .subscribe((value: number) => {
        this.changed.next(value);
        this.onChangeCallback(value);
      });
    this.writeValue(0);
  }
  testAndUpdateValue(): void {
    globalThis.setTimeout(() => {
      this.value = this.testAndChangeValue(this.value);
      this.changed.next(this.value);
      this.onChangeCallback(this.value);
      this.changeEnd.next();
    });
  }
  onKeyDown(event: KeyboardEvent): void {
    if (
      (event.key < '0' || event.key > '9') &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Backspace' &&
      event.key !== 'Delete'
    ) {
      event.preventDefault();
      return;
    }
  }
  testAndChangeValue(value: number): number {
    if (value > this.max) {
      value = this.max;
    }
    if (value < this.min) {
      value = this.min;
    }
    return value;
  }
  changeSliderPosition(value: number): void {
    this.value = value;
    if (this.live) {
      if (this.liveDebounce > 0) {
        this.onModelChanged.next(this.value);
      } else {
        this.onChangeCallback(this.value);
        this.changed.next(this.value);
      }
    }
  }
  onClickProgress(event: MouseEvent): void {
    if (this.dragSlider || this.disabled) {
      return;
    }
    this.setFromX(event.clientX);
    this.cd.markForCheck();
    this.changed.next(this.value);
    this.onChangeCallback(this.value);
  }
  saveChange(): void {
    this.changed.next(this.value);
    this.onChangeCallback(this.value);
    globalThis.setTimeout(() => {
      this.dragSlider = false;
    });
  }
  onMouseDown(event: MouseEvent): void {
    if (this.disabled) {
      return;
    }
    if (event.button === 3) {
      // disable right click drag
      return;
    }
    if (this.filled) {
      this.sliderOpacity = 1;
    }
    this.dragSlider = true;
    this.prevScreenX = event.screenX;
    this.calcParams();
    this.newValue = this.value;
    this.deltaX = 0;
    this.moveGlobal = this.renderer.listen(
      'window',
      'mousemove',
      (moveEvent: MouseEvent) => {
        this.setFromX(moveEvent.clientX);
      },
    );
    this.upGlobal = this.renderer.listen('window', 'mouseup', () => {
      if (this.filled) {
        this.sliderOpacity = 1;
      }
      this.saveChange();
      this.moveGlobal();
      this.upGlobal();
    });
    event.preventDefault();
    return;
  }
  setFromX(x: number): void {
    const rect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();

    const percentValue = (x - rect.left) / rect.width;
    this.newValue = (this.max - this.min) * percentValue + this.min;
    this.value = this.testMinMaxValue(this.newValue);
    this.sliderLeft = this.calcPercent();
    this.cd.markForCheck();
    this.changeSliderPosition(this.value);
  }
  calcParams(): void {
    if (!this.elementSlider) {
      return;
    }
    this.widthParentElement = (
      this.el.nativeElement as HTMLElement
    ).getBoundingClientRect().width;
    this.widthSliderProcent =
      ((this.elementSlider.nativeElement as HTMLElement).getBoundingClientRect()
        .width *
        100) /
      this.widthParentElement;
    this.sliderLeft = this.calcPercent();
    this.cd.markForCheck();
  }
  testMinMaxValue(value: number): number {
    if (value > this.max) {
      value = this.max;
    }
    if (value < this.min) {
      value = this.min;
    }

    value = Math.round(value / this.step) * this.step;
    return value;
  }
  calcPercent(): number {
    return (
      ((this.testMinMaxValue(this.value) - this.min) / (this.max - this.min)) *
      100
    );
  }
}
