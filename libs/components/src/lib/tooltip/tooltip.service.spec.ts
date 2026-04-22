import { inject, TestBed } from '@angular/core/testing';

import { RwTooltipService } from './tooltip.service';

describe('RwTooltipService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwTooltipService],
    });
  });

  it('should be created', inject(
    [RwTooltipService],
    (service: RwTooltipService) => {
      expect(service).toBeTruthy();
    },
  ));
});
