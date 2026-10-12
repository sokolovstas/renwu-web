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

  it('keeps error toasts until they are closed', inject(
    [RwToastService],
    (service: RwToastService) => {
      service.error('something failed');
      expect(service.toasts).toHaveLength(1);
      expect(service.toasts[0].level).toBe('error');
      expect(service.toasts[0].persistant).toBe(true);
    },
  ));

  it('auto-dismisses success toasts', inject(
    [RwToastService],
    (service: RwToastService) => {
      service.success('saved');
      expect(service.toasts[0].persistant).toBeFalsy();
    },
  ));
});
