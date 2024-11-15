import { inject, TestBed } from '@angular/core/testing';

import { RwToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwToastService],
    });
  });

  it('should be created', inject(
    [RwToastService],
    (service: RwToastService) => {
      expect(service).toBeTruthy();
    },
  ));
});
