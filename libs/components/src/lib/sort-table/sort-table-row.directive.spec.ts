import { TestBed, waitForAsync } from '@angular/core/testing';
import { SortTableRowDirective } from './sort-table-row.directive';

describe('SortTableRowDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [SortTableRowDirective],
    }).compileComponents();
  }));
});
