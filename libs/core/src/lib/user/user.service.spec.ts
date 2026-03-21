import { inject, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwUserService } from '../user/user.service';

describe('RwUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwUserService,
        provideRouter([]),
        provideLocationMocks(),
      ],
    });
  });

  it('should be created', inject([RwUserService], (service: RwUserService) => {
    expect(service).toBeTruthy();
  }));
});
