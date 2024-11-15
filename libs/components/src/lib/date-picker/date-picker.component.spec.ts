import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { DropDownComponent } from '../dropdown/dropdown.component';
import { IconComponent } from '../icon/icon.component';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [
        DatePickerComponent,
        DropDownComponent,
        ButtonComponent,
        IconComponent,
        CalendarComponent,
      ],
      imports: [FormsModule],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
