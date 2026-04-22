import { inject, TestBed } from '@angular/core/testing';
import { RwSortTableSettingsService } from './sort-table.settings.service';

describe('RwSortTableSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwSortTableSettingsService],
    });
  });

  it('should be created', inject(
    [RwSortTableSettingsService],
    (service: RwSortTableSettingsService) => {
      expect(service).toBeTruthy();
    },
  ));
});
