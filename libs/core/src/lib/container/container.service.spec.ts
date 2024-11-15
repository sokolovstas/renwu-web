import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RwContainerService } from './container.service';

describe('RwContainerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
    });
  });

  it('should be created', inject(
    [RwContainerService],
    (service: RwContainerService) => {
      expect(service).toBeTruthy();
    },
  ));
});
