import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { IconWarningComponent } from './issue/icon-warning/icon-warning.component';

describe('IconWarningComponent', () => {
  let component: IconWarningComponent;
  let fixture: ComponentFixture<IconWarningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, OzModule],
      declarations: [IconWarningComponent],
      providers: [provideRouter([]), provideLocationMocks()],
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
