import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwPreventParentScrollDirective } from './prevent-parent-scroll.directive';

describe('RwPreventParentScrollDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwPreventParentScrollDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
