import { inject, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { RwUserService } from '../user/user.service';

describe('RwUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [RwUserService],
    });
  });

  it('should be created', inject([RwUserService], (service: RwUserService) => {
    expect(service).toBeTruthy();
  }));
});
