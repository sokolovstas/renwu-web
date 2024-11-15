import { inject, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { RwIssueService } from '../issue/issue.service';

describe('RwIssueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwIssueService],
      imports: [RouterTestingModule],
    });
  });

  it('should be created', inject(
    [RwIssueService],
    (service: RwIssueService) => {
      expect(service).toBeTruthy();
    },
  ));
});
