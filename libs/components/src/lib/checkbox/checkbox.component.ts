import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { parseBoolean } from '@renwu/utils';
import { RwIconComponent } from '../icon/icon.component';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-checkbox',
  standalone: true,
  imports: [RwIconComponent],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwCheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwCheckboxComponent implements ControlValueAccessor {
  @Input()
  @HostBinding('class.required')
  required: boolean;

  @HostBinding('class.borderless')
  borderless = true;

  @Input()
  @HostBinding()
  tabindex = 0;

  value: boolean;

  @Input()
  label: string;

  @Input()
  @HostBinding('class.disabled')
  disabled: boolean;

  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: boolean) => void = noop;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.onClickCheckbox(event);
    }
  }

  constructor(private cd: ChangeDetectorRef) {}

  writeValue(value: string | number | boolean): void {
    this.value = parseBoolean(value);
    this.cd.detectChanges();
  }

  registerOnChange(fn: (_: boolean) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  onClickCheckbox(event: MouseEvent | KeyboardEvent): void {
    if (this.disabled) {
      return;
    }
    event.stopPropagation();
    this.value = !this.value;
    this.onChangeCallback(this.value);
  }
}
