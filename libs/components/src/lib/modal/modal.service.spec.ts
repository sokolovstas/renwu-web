import { inject, TestBed } from '@angular/core/testing';

import { RwModalService } from './modal.service';

describe('ModalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwModalService],
    });
  });

  it('should be created', inject(
    [RwModalService],
    (service: RwModalService) => {
      expect(service).toBeTruthy();
    },
  ));
});
