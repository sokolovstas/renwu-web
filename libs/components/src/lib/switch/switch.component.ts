
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  HostBinding,
  Input,
  ViewChild,
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
export class RwSwitchComponent implements AfterViewInit, ControlValueAccessor {
  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Input()
  labelChecked = 'Good';

  @Input()
  labelUnchecked = 'Bad';

  value: boolean;

  width: number;

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

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: boolean) => void = noop;

  constructor(private cd: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    const checkedWidth = (
      this.idChecked.nativeElement as HTMLElement
    ).getBoundingClientRect().width;
    const uncheckedWidth = (
      this.idUnchecked.nativeElement as HTMLElement
    ).getBoundingClientRect().width;
    this.width = Math.max(checkedWidth, uncheckedWidth);
    this.cd.detectChanges();
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
