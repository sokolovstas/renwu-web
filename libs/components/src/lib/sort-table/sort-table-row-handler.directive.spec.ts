import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwSortTableRowHandlerDirective } from './sort-table-row-handler.directive';

describe('RwSortTableRowHandlerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwSortTableRowHandlerDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
