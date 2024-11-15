import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLogComponent } from './time-log.component';

describe('TimeLogComponent', () => {
  let component: TimeLogComponent;
  let fixture: ComponentFixture<TimeLogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimeLogComponent],
    });
    fixture = TestBed.createComponent(TimeLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
