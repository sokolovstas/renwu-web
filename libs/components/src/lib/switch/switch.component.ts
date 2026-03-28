import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

const noop = () => {
  return;
};

@Component({
  selector: 'rw-switch',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwSwitchComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwSwitchComponent
  implements AfterViewInit, OnChanges, ControlValueAccessor
{
  private cd = inject(ChangeDetectorRef);

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Input()
  labelChecked = 'Good';

  @Input()
  labelUnchecked = 'Bad';

  value: boolean;

  /** Half-width of the track (one side); must stay in sync with label text (i18n). */
  width = 36;

  set valueInside(value: boolean) {
    this.value = value;
    this.onChangeCallback(this.value);
  }
  get valueInside(): boolean {
    return this.value;
  }

  @ViewChild('idChecked', { static: true })
  idChecked: ElementRef;

  @ViewChild('idUnchecked', { static: true })
  idUnchecked: ElementRef;

  @ViewChild('measureChecked')
  measureChecked?: ElementRef<HTMLElement>;

  @ViewChild('measureUnchecked')
  measureUnchecked?: ElementRef<HTMLElement>;

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: boolean) => void = noop;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['labelChecked'] && !changes['labelUnchecked']) {
      return;
    }
    this.scheduleMeasureWidth();
  }

  ngAfterViewInit(): void {
    this.measureWidth();
    this.scheduleMeasureWidth();
  }

  /** Re-run after layout so async i18n (e.g. transloco) updates label width. */
  private scheduleMeasureWidth(): void {
    queueMicrotask(() => this.measureWidth());
    requestAnimationFrame(() => this.measureWidth());
  }

  private measureWidth(): void {
    const checkedM = this.measureChecked?.nativeElement;
    const uncheckedM = this.measureUnchecked?.nativeElement;
    const checkedEl = this.idChecked?.nativeElement as HTMLElement | undefined;
    const uncheckedEl = this.idUnchecked?.nativeElement as HTMLElement | undefined;

    let checkedW = 0;
    let uncheckedW = 0;

    if (checkedM && uncheckedM) {
      checkedW = checkedM.getBoundingClientRect().width;
      uncheckedW = uncheckedM.getBoundingClientRect().width;
    } else if (checkedEl && uncheckedEl) {
      checkedW = checkedEl.scrollWidth;
      uncheckedW = uncheckedEl.scrollWidth;
    } else {
      return;
    }

    const next = Math.ceil(Math.max(checkedW, uncheckedW, 24));
    if (next !== this.width) {
      this.width = next;
      this.cd.markForCheck();
    }
  }

  writeValue(value: boolean): void {
    this.value = value;
    this.cd.detectChanges();
  }

  registerOnChange(fn: (_: boolean) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }
}
