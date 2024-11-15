import { inject, TestBed } from '@angular/core/testing';
import { SortTableSettingsService } from './sort-table.settings.service';

describe('SortTableSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SortTableSettingsService],
    });
  });

  it('should be created', inject(
    [SortTableSettingsService],
    (service: SortTableSettingsService) => {
      expect(service).toBeTruthy();
    },
  ));
});
