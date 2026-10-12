import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RenwuSearchOverlayService } from '@renwu/app-ui';
import { SearchSpotlightHostComponent } from './search-spotlight-host.component';

describe('SearchSpotlightHostComponent', () => {
  let fixture: ComponentFixture<SearchSpotlightHostComponent>;
  let overlay: RenwuSearchOverlayService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchSpotlightHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchSpotlightHostComponent);
    overlay = TestBed.inject(RenwuSearchOverlayService);
    fixture.detectChanges();
  });

  it('opens the overlay on Alt/Option+Space', () => {
    expect(overlay.isOpen).toBe(false);
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        altKey: true,
        bubbles: true,
      }),
    );
    expect(overlay.isOpen).toBe(true);
  });
});
