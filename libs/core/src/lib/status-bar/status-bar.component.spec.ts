import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StatusBarComponent } from './issue/status-bar/status-bar.component';

describe('StatusBarComponent', () => {
  let component: StatusBarComponent;
  let fixture: ComponentFixture<StatusBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StatusBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
