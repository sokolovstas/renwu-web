import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { Duration, formatDuration } from 'date-fns';
import durationFns from 'duration-fns';
import { RwDropDownComponent } from '../dropdown/dropdown.component';
import { RwIconComponent } from '../icon/icon.component';
import { IconName } from '../icon/list';
import { RwDurationToStringPipe } from '../pipes/duration-to-string.pipe';
import {
  RwShortcutService,
  ShortcutObservable,
} from '../shortcut/shortcut.service';
import { RwTextInputComponent } from '../text-input/text-input.component';
import { RW_TIME_PICKER_HELPER_ICON } from './time-picker.tokens';

const noop = () => {
  return;
};

@Component({
  selector: 'rw-time-picker',
  standalone: true,
  imports: [
    RwIconComponent,
    RwTextInputComponent,
    RwDropDownComponent,
    RwDurationToStringPipe,
    FormsModule,
  ],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwTimePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwTimePickerComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Input()
  @HostBinding()
  tabindex = 0;

  @ViewChild('dropdown', { static: true })
  dropdown: RwDropDownComponent;

  @ViewChild('input')
  input: RwTextInputComponent;

  value: number;

  oldValue: number;

  @Input()
  prompt = 'Set time';

  @Input()
  placeholder = '';

  @Input()
  opacity: number;

  @Input()
  max: number;

  @Input()
  disabled = false;

  @Input()
  icon: IconName;

  @Input()
  nopadding: boolean;

  @Input()
  normalize = false;

  @Input()
  hoursInDay = 8;

  @Input()
  daysInWeek = 5;

  @Input()
  defaultInputUnit: keyof Duration = 'hours';

  @Input()
  showClear = false;

  valueDuration: Duration;

  valueDurationOriginal: Duration;

  @HostBinding('class.focus')
  editOpened: boolean;

  popupOpened: boolean;

  helpers: number[];

  d1: number;

  d2: number;

  d3: number;

  d4: number;

  valueInput: string;

  focusTimeout = -1;

  shortcut: ShortcutObservable;

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: number) => void = noop;

  @HostListener('focusin', ['$event'])
  onFocus(): void {
    this.focusTimeout = globalThis.setTimeout(() => {
      this.openEdit(true);
    }, 50);
  }

  constructor(
    private shortcutService: RwShortcutService,
    private cd: ChangeDetectorRef,
    @Optional()
    @Inject(RW_TIME_PICKER_HELPER_ICON)
    timePickerHelperIcon: IconName,
  ) {
    this.editOpened = false;
    this.helpers = [
      1 * 60 * 60,
      2 * 60 * 60,
      3 * 60 * 60,
      4 * 60 * 60,
      6 * 60 * 60,
      8 * 60 * 60,
      10 * 60 * 60,
      12 * 60 * 60,
      16 * 60 * 60,
      24 * 60 * 60,
      32 * 60 * 60,
      40 * 60 * 60,
    ];
    this.icon = timePickerHelperIcon ?? this.icon ?? 'timelapse';
  }
  writeValue(value: number): void {
    this.value = value;
    this.parseValue();
    this.cd.detectChanges();
    this.updateValue();
  }

  registerOnChange(fn: (_: number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  ngOnInit(): void {
    this.parseValue();
  }
  ngOnDestroy(): void {
    this.editOpened = false;
    this.dropdown = null;
    this.input = null;
    this.valueDuration = null;
    this.valueDurationOriginal = null;
    this.helpers = null;
    if (this.shortcut) {
      this.shortcut.unsubscribe();
    }
  }
  parseValue(): void {
    if (!this.value) {
      this.valueDuration = { seconds: 0 };
      this.valueDurationOriginal = { seconds: 0 };
    } else {
      this.valueDuration = { seconds: this.value };
      this.valueDurationOriginal = { seconds: this.value };
    }
    this.parseValueDuration();
  }
  parseValueDuration(): void {
    this.valueInput = '';
    const countHours = Math.floor(durationFns.toHours(this.valueDuration));
    if (countHours > 0) {
      this.valueInput += `${
        this.valueInput.length > 0 ? ' ' : ''
      }${countHours}h`;
    }
    const minutes =
      Math.floor(durationFns.toMinutes(this.valueDuration)) - countHours * 60;
    if (minutes > 0) {
      this.valueInput += `${this.valueInput.length > 0 ? ' ' : ''}${minutes}m`;
    }
    const seconds =
      Math.floor(durationFns.toSeconds(this.valueDuration)) -
      countHours * 60 * 60 -
      minutes * 60;
    if (seconds > 0) {
      this.valueInput += `${this.valueInput.length > 0 ? ' ' : ''}${seconds}s`;
    }
  }
  setFromHelper(value: number): void {
    this.valueDuration = { seconds: value };
    this.parseValueDuration();
    this.disableSelectMode();
    this.updateValue();
  }
  openEdit(value: boolean, omitChanges?: boolean): void {
    if (this.disabled) {
      return;
    }
    if (!value) {
      if (!omitChanges) {
        this.editOpened = false;
        this.parseInput();
        this.updateValue();
      } else {
        this.value = this.oldValue;
      }
    } else {
      this.editOpened = true;
      this.oldValue = this.value;
      globalThis.setTimeout(() => {
        this.input.switchPopup(true);
      });
    }
    this.cd.markForCheck();
  }
  switchPopup(): void {
    return;
  }
  updateValue(): void {
    this.onChangeCallback(durationFns.toSeconds(this.valueDuration));
  }
  getLabel(): string {
    if (!this.valueDuration) {
      return '';
    } else if (durationFns.toSeconds(this.valueDuration) === 0) {
      return '';
    } else {
      return this.normalize
        ? formatDuration(durationFns.normalize(this.valueDuration))
        : formatDuration({ hours: durationFns.toHours(this.valueDuration) });
    }
  }
  onKeyDown(event: KeyboardEvent): void {
    if (
      (event.key < '0' || event.key > '9') &&
      event.code !== 'KeyW' &&
      event.code !== 'KeyD' &&
      event.code !== 'KeyH' &&
      event.code !== 'KeyM' &&
      event.code !== 'KeyS' &&
      event.code !== 'ArrowRight' &&
      event.code !== 'ArrowLeft' &&
      event.code !== 'Backspace' &&
      event.code !== 'Delete' &&
      event.code !== 'Space' &&
      event.code !== 'Tab'
    ) {
      event.preventDefault();
    }
  }
  parseInput(): void {
    this.valueDuration = {};
    if (this.valueInput.length === 0) {
      return;
    }
    let valueInput = this.valueInput;
    let str = '';
    while (valueInput.length > 0) {
      if (valueInput[0].toLowerCase() === 'w') {
        // weeks
        this.valueDuration = durationFns.sum(this.valueDuration, {
          hours: parseInt(str, 10) * this.hoursInDay * this.daysInWeek,
        });
        str = '';
      } else if (valueInput[0].toLowerCase() === 'd') {
        // days
        this.valueDuration = durationFns.sum(this.valueDuration, {
          hours: parseInt(str, 10) * this.hoursInDay,
        });
        str = '';
      } else if (valueInput[0].toLowerCase() === 'h') {
        // hours
        this.valueDuration = durationFns.sum(this.valueDuration, {
          hours: parseInt(str, 10),
        });
        str = '';
      } else if (valueInput[0].toLowerCase() === 'm') {
        // minutes
        this.valueDuration = durationFns.sum(this.valueDuration, {
          minutes: parseInt(str, 10),
        });
        str = '';
      } else if (valueInput[0].toLowerCase() === 's') {
        // minutes
        this.valueDuration = durationFns.sum(this.valueDuration, {
          seconds: parseInt(str, 10),
        });
        str = '';
      } else {
        str += valueInput[0];
      }
      valueInput = valueInput.slice(1);
    }
    if (str.length > 0) {
      const def: Duration = {};
      def[this.defaultInputUnit] = parseInt(str, 10);
      this.valueDuration = durationFns.sum(this.valueDuration, def);
      str = '';
    }
    if (this.max) {
      if (durationFns.toSeconds(this.valueDuration) > this.max) {
        this.valueDuration = { seconds: this.max };
      }
    }
    this.parseValueDuration();
  }
  enableSelectMode(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(this.focusTimeout);
    this.dropdown.show();
    this.shortcut = this.shortcutService.subscribe('Escape', () => {
      this.disableSelectMode();
    });
  }
  disableSelectMode(): void {
    this.dropdown.hide();
    if (this.shortcut) {
      this.shortcut.unsubscribe();
    }
  }
  onInputChange(value: string): void {
    this.valueInput = value;
    this.openEdit(false);
  }
  onClear(event: MouseEvent): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    this.writeValue(0);
    this.updateValue();
  }
}
