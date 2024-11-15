import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { OzModule } from 'projects/components/src/public-api';
import { UserModule } from 'src/app-old/user/user.module';
import { CoreModule } from 'src/app/core/core.module';
import { PolicyService } from 'src/app/core/policy.service';

describe('PolicyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CoreModule, UserModule, OzModule],
      providers: [],
    });
  });

  it('should be created', inject([PolicyService], (service: PolicyService) => {
    expect(service).toBeTruthy();
  }));
});
