import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableDirective } from './sort-table.directive';

describe('RwSortTableDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
