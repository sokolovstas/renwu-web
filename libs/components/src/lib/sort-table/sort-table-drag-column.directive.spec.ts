import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableDragColumnDirective } from './sort-table-drag-column.directive';

describe('RwSortTableDragColumnDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableDragColumnDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
