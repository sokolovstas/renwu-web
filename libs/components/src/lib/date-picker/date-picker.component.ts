
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { parseRelativeDate } from '@renwu/utils';
import {
  endOfDay,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns';
import { RwButtonComponent } from '../button/button.component';
import { RwCalendarComponent } from '../calendar/calendar.component';
import { RwDropDownComponent } from '../dropdown/dropdown.component';
import { RwIconComponent } from '../icon/icon.component';
import { RwTextInputComponent } from '../text-input/text-input.component';
import {
  RW_SHOW_DATE_FORMAT,
  RW_SHOW_DATE_TIME_FORMAT,
} from './date-picker.token';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-date-picker',
  standalone: true,
  imports: [
    RwDropDownComponent,
    RwCalendarComponent,
    RwTextInputComponent,
    RwButtonComponent,
    RwIconComponent,
    FormsModule,
    TranslocoPipe
],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwDatePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwDatePickerComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  protected el = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);
  private dateTimeShowFormat = inject(RW_SHOW_DATE_FORMAT, { optional: true });
  private dateShowFormat = inject(RW_SHOW_DATE_TIME_FORMAT, { optional: true });

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @ViewChild('dropdown', { static: true })
  dropdown: RwDropDownComponent;

  @Input()
  range: boolean;

  @Input()
  helpers = true;

  @Input()
  displayFormat: string;

  @Input()
  prompt = 'Select date';

  @Input()
  @HostBinding('class.disabled')
  disabled: boolean;

  @Output()
  changed = new EventEmitter<DatePickerValue>();

  @Input()
  showTime: boolean;

  @Input()
  allowNull: boolean;

  @Input()
  live: boolean;

  @Input()
  confirmRequired: boolean;

  @Input()
  maxDate: Date;

  @Input()
  minDate: Date;

  selectionStart: Date;
  selectionStartOld: Date;
  selectionEnd: Date;
  selectionEndOld: Date;

  value: DatePickerValue;

  opened: boolean;

  label: string;

  now: Date = new Date();

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: DatePickerValue) => void = noop;

  @HostBinding()
  tabindex = 0;

  private _labelStart: string;
  private _labelEnd: string;

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.openDateSelector();
    } else if (event.key === 'Escape') {
      this.opened = false;
      this.changed.next(this.value);
      this.onChangeCallback(this.value);
    }
  }

  set labelStart(value: string) {
    this.value = this.parseValue(value, 'from');

    this.selectionStart = this.value;

    if (!this.range) {
      this.selectionEnd = this.value;
    }
    if (
      this.selectionStart &&
      (isAfter(this.selectionStart, this.selectionEnd) || !this.selectionEnd)
    ) {
      this.labelEnd = format(endOfDay(this.selectionStart), this.displayFormat);
    }
    if (this._labelStart !== value) {
      this._labelStart = value;
      this.onChange();
    }
  }

  get labelStart(): string {
    return this._labelStart;
  }

  set labelEnd(value: string) {
    this.selectionEnd = this.parseValue(value, 'to');

    if (
      isBefore(this.selectionEnd, this.selectionStart) ||
      !this.selectionStart
    ) {
      this.labelStart = format(
        startOfDay(this.selectionEnd),
        this.displayFormat,
      );
    }
    if (this._labelEnd !== value) {
      this._labelEnd = value;
      this.onChange();
    }
  }
  get labelEnd(): string {
    return this._labelEnd;
  }

  constructor() {
    this.opened = false;
    this.dateTimeShowFormat = this.dateTimeShowFormat || 'P p';
    this.dateShowFormat = this.dateShowFormat || 'P';
  }

  writeValue(value: DatePickerValue): void {
    if (!value) {
      this.now = new Date();
      this.value = null;
      this.selectionStart = this.selectionStartOld = null;
      this.selectionEnd = this.selectionEndOld = null;
    } else {
      if (Array.isArray(value) && value.length === 2) {
        const start = this.normalizeIncomingDate(value[0]);
        const end = this.normalizeIncomingDate(value[1]);
        this.value = start;
        this.selectionStart = this.selectionStartOld = start;
        this.selectionEnd = this.selectionEndOld = end;
      } else {
        if (typeof value === 'string') {
          const parsed = this.normalizeIncomingDate(parseISO(value as string));
          this.value =
            this.selectionStart =
            this.selectionEnd =
            this.selectionStartOld =
            this.selectionEndOld =
              parsed;
        } else {
          const parsed = this.normalizeIncomingDate(value as Date);
          this.value =
            this.selectionStart =
            this.selectionEnd =
            this.selectionStartOld =
            this.selectionEndOld =
              parsed;
        }
      }
    }
    this.setLabel();
    this.cd.detectChanges();
  }

  private normalizeIncomingDate(date: Date): Date | null {
    if (!date || !isValid(date) || date.getFullYear() < 1970) {
      return null;
    }
    return date;
  }

  registerOnChange(fn: (_: DatePickerValue) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  ngOnInit(): void {
    this.displayFormat = this.showTime
      ? this.dateTimeShowFormat
      : this.dateShowFormat;

    this.setLabel();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showTime']) {
      this.displayFormat = this.showTime
        ? this.dateTimeShowFormat
        : this.dateShowFormat;
    }
    this.setLabel();
  }
  parseValue(value: string, type: 'from' | 'to' | ''): Date {
    if (!value) {
      return null;
    } else {
      let result = parse(value, this.displayFormat, new Date());
      if (isValid(result)) {
        return result;
      }
      result = parseRelativeDate(value, type);
      if (isValid(result)) {
        return result;
      }
      return new Date();
    }
  }
  openDateSelector(): void {
    if (this.disabled) {
      return;
    }
    this.opened = !this.opened;
    if (this.opened) {
      this.setLabel();
    }
    this.dropdown.show();
  }

  onClearDate(): void {
    this.changed.next(null);
    this.writeValue(null);
    this.onChangeCallback(null);
    this.opened = !this.opened;
    this.dropdown.hide();
    (this.el.nativeElement as HTMLElement).focus();
  }
  setLabel(): void {
    if (!this.range) {
      if (this.value) {
        this.label = format(this.value as Date, this.displayFormat);
        this._labelStart = this.label;
        this.cd.markForCheck();
        return;
      }
    } else {
      if (this.value) {
        if (this.selectionStart && this.selectionEnd) {
          this.label =
            format(this.selectionStart, this.displayFormat) +
            ' - ' +
            format(this.selectionEnd, this.displayFormat);
          this._labelStart = format(this.selectionStart, this.displayFormat);
          this._labelEnd = format(this.selectionEnd, this.displayFormat);
          this.cd.markForCheck();
          return;
        }
      }
    }
    this.label = '';
    this._labelStart = '';
    this._labelEnd = '';
    this.cd.markForCheck();
  }
  onCalendarChangeStart(event: Date): void {
    this.labelStart = format(event, this.displayFormat);
    this.onChange();
  }
  onCalendarChangeEnd(event: Date): void {
    this.labelEnd = format(event, this.displayFormat);
    this.onChange();
  }
  onChange(): void {
    if (!this.live && !this.confirmRequired) {
      this.close();
      return;
    }
    if (this.live || !this.confirmRequired) {
      this.updateValue();
    }
  }
  onApply(): void {
    this.updateValue();
    this.close();
  }
  updateValue(): void {
    if (this.range) {
      this.writeValue([this.selectionStart, this.selectionEnd]);
    } else {
      this.writeValue(this.selectionStart);
    }
    this.changed.next(this.value);
    this.onChangeCallback(this.value);
    this.setLabel();
  }
  close(): void {
    if (!this.confirmRequired) {
      this.updateValue();
    } else {
      if (this.range) {
        this.writeValue([this.selectionStartOld, this.selectionEndOld]);
      } else {
        this.writeValue(this.selectionStartOld);
      }
    }
    this.opened = false;
    this.dropdown.hide();
    (this.el.nativeElement as HTMLElement).focus();
  }
  setRelative(from: string, to: string): void {
    this.labelStart = from;
    this.labelEnd = to;
    this.onChange();
  }
}
export type DatePickerValue = Date | [Date, Date] | string;
