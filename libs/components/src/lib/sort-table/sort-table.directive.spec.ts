import { TestBed, waitForAsync } from '@angular/core/testing';
import { SortTableDirective } from './sort-table.directive';

describe('SortTableDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [SortTableDirective],
    }).compileComponents();
  }));
});
