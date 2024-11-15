import { inject, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'src/app-old/message/service/message.service';
import { UserModule } from 'src/app-old/user/user.module';
import { CoreModule } from 'src/app/core/core.module';

describe('MessageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RwModule, RouterTestingModule, UserModule, CoreModule],
      providers: [MessageService],
    });
  });

  it('should be created', inject(
    [MessageService],
    (service: MessageService) => {
      expect(service).toBeTruthy();
    },
  ));
});
