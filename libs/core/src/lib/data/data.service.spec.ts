import { inject, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RwDataService } from './data.service';

describe('RwDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RwDataService],
    });
  });

  it('should be created', inject([RwDataService], (service: RwDataService) => {
    expect(service).toBeTruthy();
  }));
});
