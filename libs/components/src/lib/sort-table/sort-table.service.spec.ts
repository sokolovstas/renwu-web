import { inject, TestBed } from '@angular/core/testing';
import { SortTableService } from './sort-table.service';
import { SortTableSettingsService } from './sort-table.settings.service';

describe('SortTableService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SortTableSettingsService, SortTableService],
    });
  });

  it('should be created', inject(
    [SortTableService],
    (service: SortTableService) => {
      expect(service).toBeTruthy();
    },
  ));
});
