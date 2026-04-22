import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableColumnDirective } from './sort-table-column.directive';

describe('RwSortTableColumnDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableColumnDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
