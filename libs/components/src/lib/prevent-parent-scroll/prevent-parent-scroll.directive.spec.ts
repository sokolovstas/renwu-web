import { TestBed, waitForAsync } from '@angular/core/testing';
import { PreventParentScrollDirective } from './prevent-parent-scroll.directive';

describe('PreventParentScrollDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [PreventParentScrollDirective],
    }).compileComponents();
  }));
});
