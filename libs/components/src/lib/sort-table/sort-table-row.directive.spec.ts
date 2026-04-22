import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableRowDirective } from './sort-table-row.directive';

describe('RwSortTableRowDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableRowDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
