import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableDragColumnHandlerDirective } from './sort-table-drag-column-handler.directive';

describe('RwSortTableDragColumnHandlerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableDragColumnHandlerDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
