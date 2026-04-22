import { inject, TestBed } from '@angular/core/testing';
import { RwSortTableService } from './sort-table.service';
import { RwSortTableSettingsService } from './sort-table.settings.service';

describe('RwSortTableService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwSortTableSettingsService, RwSortTableService],
    });
  });

  it('should be created', inject(
    [RwSortTableService],
    (service: RwSortTableService) => {
      expect(service).toBeTruthy();
    },
  ));
});
