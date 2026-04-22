import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RwDropDownDirective } from './dropdown.directive';

@Component({
  standalone: true,
  imports: [RwDropDownDirective],
  template: `<div rwDropdown></div>`,
})
class HostComponent {}

describe('RwDropDownDirective', () => {
  it('loads with host template', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    expect(TestBed.createComponent(HostComponent)).toBeTruthy();
  });
});
