import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwCalendarComponent } from './calendar.component';

describe('RwCalendarComponent', () => {
  let component: RwCalendarComponent;
  let fixture: ComponentFixture<RwCalendarComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwCalendarComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
