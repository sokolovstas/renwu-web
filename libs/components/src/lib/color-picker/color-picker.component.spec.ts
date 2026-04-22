import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwColorPickerComponent } from './color-picker.component';

describe('ColorpickerComponent', () => {
  let component: RwColorPickerComponent;
  let fixture: ComponentFixture<RwColorPickerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwColorPickerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
