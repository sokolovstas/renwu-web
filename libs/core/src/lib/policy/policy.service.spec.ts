import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RwToastService } from '@renwu/components';
import { RwDataService } from '../data/data.service';
import { RwUserService } from '../user/user.service';
import { RwPolicyService } from './policy.service';

describe('RwPolicyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RwPolicyService,
        { provide: RwUserService, useValue: {} },
        { provide: RwDataService, useValue: {} },
        { provide: RwToastService, useValue: {} },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(RwPolicyService)).toBeTruthy();
  });
});
