import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShortcutService } from '../shortcut/shortcut.service';
import { ShortcutServiceStub } from '../../test/shortcut-service-stub';
import { RwTimePickerComponent } from './time-picker.component';

describe('RwTimePickerComponent', () => {
  let component: RwTimePickerComponent;
  let fixture: ComponentFixture<RwTimePickerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [FormsModule, RwTimePickerComponent],
      providers: [
        {
          provide: ShortcutService,
          useClass: ShortcutServiceStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTimePickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
