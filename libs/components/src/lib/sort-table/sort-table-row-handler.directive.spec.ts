import { TestBed, waitForAsync } from '@angular/core/testing';
import { SortTableRowHandlerDirective } from './sort-table-row-handler.directive';

describe('SortTableRowHandlerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [SortTableRowHandlerDirective],
    }).compileComponents();
  }));
});
