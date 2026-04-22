import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwTooltipDirective } from './tooltip.directive';

describe('RwTooltipDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwTooltipDirective],
    }).compileComponents();
  }));

  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });
});
