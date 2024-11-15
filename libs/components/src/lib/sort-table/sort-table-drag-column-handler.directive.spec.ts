import { TestBed, waitForAsync } from '@angular/core/testing';
import { SortTableDragColumnHandlerDirective } from './sort-table-drag-column-handler.directive';

describe('SortTableDragColumnHandlerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [SortTableDragColumnHandlerDirective],
    }).compileComponents();
  }));
});
