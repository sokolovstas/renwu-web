import { inject, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwIssueService } from '../issue/issue.service';

describe('RwIssueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwIssueService,
        provideRouter([]),
        provideLocationMocks(),
      ],
    });
  });

  it('should be created', inject(
    [RwIssueService],
    (service: RwIssueService) => {
      expect(service).toBeTruthy();
    },
  ));
});
