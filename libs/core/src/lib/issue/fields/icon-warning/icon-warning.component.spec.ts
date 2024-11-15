import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { IconWarningComponent } from './issue/icon-warning/icon-warning.component';

describe('IconWarningComponent', () => {
  let component: IconWarningComponent;
  let fixture: ComponentFixture<IconWarningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, OzModule, RouterTestingModule],
      declarations: [IconWarningComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
