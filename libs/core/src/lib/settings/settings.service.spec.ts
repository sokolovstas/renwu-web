import { inject, TestBed } from '@angular/core/testing';
import { RwSettingsService } from './settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [RwSettingsService],
    });
  });

  it('should be created', inject(
    [RwSettingsService],
    (service: RwSettingsService) => {
      expect(service).toBeTruthy();
    },
  ));
});
