import { inject, TestBed } from '@angular/core/testing';

import { RwAlertService } from './alert.service';

describe('AlertService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwAlertService],
    });
  });

  it('should be created', inject(
    [RwAlertService],
    (service: RwAlertService) => {
      expect(service).toBeTruthy();
    },
  ));
});
