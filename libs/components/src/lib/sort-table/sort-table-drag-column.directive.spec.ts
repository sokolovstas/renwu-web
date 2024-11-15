import { TestBed, waitForAsync } from '@angular/core/testing';
import { SortTableDragColumnDirective } from './sort-table-drag-column.directive';

describe('SortTableDragColumnDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [SortTableDragColumnDirective],
    }).compileComponents();
  }));
});
