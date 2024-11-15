
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  addDays,
  addMonths,
  addYears,
  differenceInMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  format,
  getDate,
  getISODay,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  setMonth,
  setYear,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';

export interface RwCalendarDay {
  date: Date;
  label: string;
  today: boolean;
  first: boolean;
  last: boolean;
  isoweekday: number;
  selected: boolean;
  selectedStart: boolean;
  selectedEnd: boolean;
  overflow: boolean;
  holiday: boolean;
  period: boolean;
}

type RwCalendarViewState = 'month' | 'months' | 'years';

@Component({
  selector: 'rw-calendar',
  standalone: true,
  imports: [],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwCalendarComponent implements OnInit, OnChanges {
  @Input()
  hideOverflow: boolean;

  @Input()
  selectionStart: Date;

  @Input()
  selectionEnd: Date;

  @Input()
  holidays: Array<Date>;

  @Input()
  hideMonthYearSelection: boolean;

  @Output()
  changed = new EventEmitter<Date>();

  @Input()
  currentDate: Date = new Date();

  @Input()
  minDate: Date;

  @Input()
  maxDate: Date;

  dateCells: RwCalendarDay[];

  weekCells: RwCalendarDay[][];

  weekdays: string[];

  currentState: RwCalendarViewState = 'month';

  months: string[];

  years: number[];

  currentMonth: number;
  currentYear: number;
  currentEra: string;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    const now = new Date();
    this.weekdays = eachDayOfInterval({
      start: startOfISOWeek(now),
      end: endOfISOWeek(now),
    }).map((day) => format(day, 'EE'));
    this.months = eachMonthOfInterval({
      start: startOfYear(now),
      end: endOfYear(now),
    }).map((month) => format(month, 'MMMM'));
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate']) {
      this.currentDate = isValid(changes['currentDate'].currentValue)
        ? new Date(changes['currentDate'].currentValue as Date)
        : new Date();
      this.render();
    }
    if (changes['holidays']) {
      this.render();
    }
    if (changes['selectionStart'] || changes['selectionEnd']) {
      this.setSelection();
      this.cd.markForCheck();
    }
  }

  render(): void {
    const now = new Date();
    let monthStart = startOfMonth(this.currentDate);
    let monthEnd = endOfMonth(this.currentDate);

    this.currentYear = getYear(this.currentDate);
    this.currentMonth = getMonth(this.currentDate);

    if (getISODay(monthStart) !== 1) {
      monthStart = subDays(monthStart, getISODay(monthStart) - 1);
    }
    if (getISODay(monthStart) !== 7) {
      monthEnd = addDays(monthEnd, 7 - getISODay(monthEnd));
    }

    if (this.currentState === 'years') {
      this.years = [];
      for (let y = this.currentYear - 12; y < this.currentYear + 13; y++) {
        this.years.push(y);
      }
      this.currentEra = `${this.currentYear - 12} - ${this.currentYear + 13}`;
    }

    this.dateCells = [];
    let safeCounter = 100;

    while (isBefore(monthStart, monthEnd) && safeCounter > 0) {
      const day = {
        date: new Date(monthStart),
        label: String(getDate(monthStart)),
        isoweekday: getISODay(monthStart),
        overflow: getMonth(monthStart) !== this.currentMonth,
        today: isSameDay(monthStart, now),
        selected: false,
        first: false,
        last: false,
        selectedStart: false,
        selectedEnd: false,
        holiday: false,
        period: false,
      };
      const hideDay = this.hideOverflow && day.overflow;
      if (hideDay) {
        day.label = '';
      }

      if (
        this.holidays &&
        this.holidays.some((holiday) => {
          return format(day.date, 'DDMMYYYY') === format(holiday, 'DDMMYYYY');
        })
      ) {
        if (!day.overflow || (day.overflow && !this.hideOverflow)) {
          day.holiday = true;
        }
      }

      this.dateCells.push(day);
      monthStart = addDays(monthStart, 1);
      safeCounter--;
    }

    this.dateCells[0].first = true;
    this.dateCells[this.dateCells.length - 1].last = true;

    this.weekCells = [
      this.dateCells.slice(0, 7),
      this.dateCells.slice(7, 14),
      this.dateCells.slice(14, 21),
      this.dateCells.slice(21, 28),
      this.dateCells.slice(28, 35),
      this.dateCells.slice(35, 42),
    ];
    this.setSelection();
    this.cd.markForCheck();
  }
  setSelection(): void {
    if (!this.selectionStart || !this.selectionEnd) {
      return;
    }

    const period =
      differenceInMonths(this.selectionStart, this.selectionEnd) >= 1;
    if (this.dateCells) {
      for (const dateCell of this.dateCells) {
        dateCell.selectedStart = false;
        dateCell.selectedEnd = false;

        const selected =
          (isAfter(dateCell.date, this.selectionStart) ||
            isSameDay(dateCell.date, this.selectionStart)) &&
          (isBefore(dateCell.date, this.selectionEnd) ||
            isSameDay(dateCell.date, this.selectionEnd));
        dateCell.selected = !period && selected;
        dateCell.period = period && selected;
        if (isSameDay(dateCell.date, this.selectionStart) && period) {
          dateCell.selectedStart = true;
        }
        if (isSameDay(dateCell.date, this.selectionEnd) && period) {
          dateCell.selectedEnd = true;
        }
      }
    }
  }
  onClick(day: RwCalendarDay): void {
    this.changed.next(day.date);
  }
  setState(state: RwCalendarViewState): void {
    this.currentState = state;
    this.render();
  }
  prev(): void {
    switch (this.currentState) {
      case 'month':
        this.currentDate = subMonths(this.currentDate, 1);
        break;
      case 'months':
        this.currentDate = subYears(this.currentDate, 1);
        break;
      case 'years':
        this.currentDate = subYears(this.currentDate, 25);
        break;
    }
    this.render();
  }
  next(): void {
    switch (this.currentState) {
      case 'month':
        this.currentDate = addMonths(this.currentDate, 1);
        break;
      case 'months':
        this.currentDate = addYears(this.currentDate, 1);
        break;
      case 'years':
        this.currentDate = addYears(this.currentDate, 25);
        break;
    }

    this.render();
  }
  setMonth(value: number): void {
    this.currentDate = setMonth(this.currentDate, value);
    this.setState('month');
    this.render();
  }
  setYear(value: number): void {
    this.currentDate = setYear(this.currentDate, value);
    this.setState('months');
  }
  getCurrentMonthName(): string {
    return format(this.currentDate, 'MMMM');
  }
  updateDisplayPeriod(): void {
    this.cd.markForCheck();
  }

  isDateDisabled(date: RwCalendarDay): boolean {
    if (this.minDate && isBefore(date.date, this.minDate)) {
      return true;
    }

    if (this.maxDate && isAfter(date.date, this.maxDate)) {
      return true;
    }

    return false;
  }
}
