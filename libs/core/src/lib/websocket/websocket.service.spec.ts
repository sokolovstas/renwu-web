import { inject, TestBed } from '@angular/core/testing';

import { RwWebsocketService } from './websocket.service';

describe('RwWebsocketService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwWebsocketService],
    });
  });

  it('should be created', inject(
    [RwWebsocketService],
    (service: RwWebsocketService) => {
      expect(service).toBeTruthy();
    },
  ));
});
