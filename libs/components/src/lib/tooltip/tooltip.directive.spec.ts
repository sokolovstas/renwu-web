import { TestBed, waitForAsync } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [TooltipDirective],
    }).compileComponents();
  }));
});
