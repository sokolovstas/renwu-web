import 'jest-zone-transloco-setup';
import { TestBed } from '@angular/core/testing';
import { RwToastService } from '@renwu/components';
import {
  CheckUserValidator,
  RwDataService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileUserService } from './app/profile-user.service';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      ProfileUserService,
      {
        provide: CheckUserValidator,
        useValue: { validate: () => Promise.resolve(null) },
      },
      {
        provide: RwDataService,
        useValue: { getUserByUsername: jest.fn().mockReturnValue(of(null)) },
      },
      {
        provide: RwUserService,
        useValue: {
          currentUser: new BehaviorSubject(null),
          currentUserValue: null,
          saveUser: jest.fn().mockReturnValue(of({ user: {} })),
        },
      },
      { provide: RwToastService, useValue: { error: jest.fn() } },
      { provide: StateService, useValue: {} },
    ],
  });
});
