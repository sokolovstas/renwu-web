import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TourService } from 'ngx-ui-tour-core';
import { RenwuTourAnchorDirective } from './tour-anchor.directive';

@Component({
  standalone: true,
  imports: [RenwuTourAnchorDirective],
  template: `<div renwuTourAnchor="test"></div>`,
})
class HostComponent {}

describe('RenwuTourAnchorDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: TourService,
          useValue: {
            register: jest.fn(),
            unregister: jest.fn(),
          },
        },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
