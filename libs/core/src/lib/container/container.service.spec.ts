import { inject, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwContainerService } from './container.service';

describe('RwContainerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideLocationMocks()],
    });
  });

  it('should be created', inject(
    [RwContainerService],
    (service: RwContainerService) => {
      expect(service).toBeTruthy();
    },
  ));
});
