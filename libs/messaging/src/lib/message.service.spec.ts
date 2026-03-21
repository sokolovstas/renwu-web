import { inject, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'src/app-old/message/service/message.service';
import { UserModule } from 'src/app-old/user/user.module';
import { CoreModule } from 'src/app/core/core.module';

describe('MessageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RwModule, UserModule, CoreModule],
      providers: [MessageService, provideRouter([]), provideLocationMocks()],
    });
  });

  it('should be created', inject(
    [MessageService],
    (service: MessageService) => {
      expect(service).toBeTruthy();
    },
  ));
});
