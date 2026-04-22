import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import {
  RwContainerService,
  RwDataService,
  RwPolicyService,
  RwSettingsService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { RwMessageService } from '../message.service';
import { DestinationsComponent } from './destinations.component';

describe('DestinationsComponent', () => {
  it('compiles', async () => {
    await TestBed.configureTestingModule({
      imports: [DestinationsComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwDataService, useValue: {} },
        { provide: StateService, useValue: {} },
        { provide: RwUserService, useValue: {} },
        {
          provide: RwMessageService,
          useValue: {
            connected: new BehaviorSubject(true),
          },
        },
        { provide: RwPolicyService, useValue: {} },
        { provide: RwContainerService, useValue: {} },
        { provide: RwSettingsService, useValue: { user: {} } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(),
            queryParamMap: of(),
          },
        },
      ],
    }).compileComponents();
    expect(true).toBe(true);
  });
});
