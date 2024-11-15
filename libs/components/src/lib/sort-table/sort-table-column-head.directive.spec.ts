import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableColumnHeadDirective } from './sort-table-column-head.directive';

describe('RwSortTableColumnHeadDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [RwSortTableColumnHeadDirective],
    }).compileComponents();
  }));
});
