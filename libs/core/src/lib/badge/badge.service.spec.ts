import { inject, TestBed } from '@angular/core/testing';
import { RwBadgeService } from './badge.service';

describe('BadgeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwBadgeService],
    });
  });

  it('should be created', inject(
    [RwBadgeService],
    (service: RwBadgeService) => {
      expect(service).toBeTruthy();
    },
  ));
});
