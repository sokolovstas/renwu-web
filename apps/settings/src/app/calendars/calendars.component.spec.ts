import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarsComponent } from './calendars.component';

describe('CalendarsComponent', () => {
  let component: CalendarsComponent;
  let fixture: ComponentFixture<CalendarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
