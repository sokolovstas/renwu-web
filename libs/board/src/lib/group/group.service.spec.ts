import { inject, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { GroupService } from 'src/app/board/group.service';
import { CoreModule } from 'src/app/core/core.module';

describe('GroupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [GroupService, provideRouter([]), provideLocationMocks()],
    });
  });

  it('should be created', inject([GroupService], (service: GroupService) => {
    expect(service).toBeTruthy();
  }));
});
