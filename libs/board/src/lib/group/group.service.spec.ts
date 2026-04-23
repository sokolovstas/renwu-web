import { TestBed } from '@angular/core/testing';
import { RwContainerService, RwDataService } from '@renwu/core';
import { of } from 'rxjs';
import { RwGroupService } from './group.service';

describe('RwGroupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwGroupService,
        {
          provide: RwContainerService,
          useValue: {
            statusMap: new Map(),
            priorityMap: new Map(),
            typeMap: new Map(),
            resolutionMap: new Map(),
            getMilestones: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: RwDataService,
          useValue: {
            getDictionaryOptions: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(RwGroupService)).toBeTruthy();
  });
});
