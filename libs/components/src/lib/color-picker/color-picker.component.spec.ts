import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { DropDownComponent } from '../dropdown/dropdown.component';
import { IconComponent } from '../icon/icon.component';
import { TextInputComponent } from '../text-input/text-input.component';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorpickerComponent', () => {
  let component: ColorPickerComponent;
  let fixture: ComponentFixture<ColorPickerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        ColorPickerComponent,
        DropDownComponent,
        TextInputComponent,
        IconComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
