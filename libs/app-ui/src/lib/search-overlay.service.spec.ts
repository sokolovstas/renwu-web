import { TestBed } from '@angular/core/testing';
import { RenwuSearchOverlayService } from './search-overlay.service';

describe('RenwuSearchOverlayService', () => {
  let service: RenwuSearchOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenwuSearchOverlayService);
  });

  it('opens, closes and toggles the overlay', () => {
    expect(service.isOpen).toBe(false);
    service.show();
    expect(service.isOpen).toBe(true);
    service.hide();
    expect(service.isOpen).toBe(false);
    service.toggle();
    expect(service.isOpen).toBe(true);
    service.toggle();
    expect(service.isOpen).toBe(false);
  });
});
