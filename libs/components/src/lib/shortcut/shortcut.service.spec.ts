import { inject, TestBed } from '@angular/core/testing';

import { RwShortcutService } from './shortcut.service';

describe('RwShortcutService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwShortcutService],
    });
  });

  it('should be created', inject(
    [RwShortcutService],
    (service: RwShortcutService) => {
      expect(service).toBeTruthy();
    },
  ));
});
