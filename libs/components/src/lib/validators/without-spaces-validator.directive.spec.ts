import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RwWithOutSpacesValidatorDirective } from './without-spaces-validator.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RwWithOutSpacesValidatorDirective],
  template:
    '<input rwValidateWithOutSpaces validateWithOutSpaces="x" [formControl]="ctrl" />',
})
class HostComponent {
  ctrl = new FormControl('');
}

describe('RwWithOutSpacesValidatorDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
  });

  it('should be valid on A', () => {
    fixture.componentInstance.ctrl.setValue('A');
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.valid).toBe(true);
  });

  it('should trim and be valid', () => {
    fixture.componentInstance.ctrl.setValue('  A  ');
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.valid).toBe(true);
  });

  it('should be invalid on space char', () => {
    fixture.componentInstance.ctrl.setValue(' ');
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.valid).toBe(false);
  });
});
