import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [ButtonComponent, IconComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
