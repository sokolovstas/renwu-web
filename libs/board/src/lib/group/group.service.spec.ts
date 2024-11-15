import { inject, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { GroupService } from 'src/app/board/group.service';
import { CoreModule } from 'src/app/core/core.module';

describe('GroupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, RouterTestingModule],
      providers: [GroupService],
    });
  });

  it('should be created', inject([GroupService], (service: GroupService) => {
    expect(service).toBeTruthy();
  }));
});
