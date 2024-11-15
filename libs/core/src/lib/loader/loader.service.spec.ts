import { inject, TestBed } from '@angular/core/testing';
import { RwWebsocketService } from '../websocket/websocket.service';
import { RwLoaderService } from './loader.service';

describe('LoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RwLoaderService, RwWebsocketService],
    });
  });

  it('should be created', inject(
    [RwLoaderService],
    (service: RwLoaderService) => {
      expect(service).toBeTruthy();
    },
  ));
});
