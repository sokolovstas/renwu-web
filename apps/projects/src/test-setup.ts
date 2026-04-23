import 'jest-zone-transloco-setup';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import { RwAlertService, RwToastService } from '@renwu/components';
import {
  RW_CORE_SETTINGS,
  RwContainerService,
  RwDataService,
  RwWebsocketService,
  UniqueContainerKeyValidator,
} from '@renwu/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { ProjectService } from './app/project.service';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: RW_CORE_SETTINGS,
        useValue: { siteBillingUrl: '', siteLoginUrl: '', siteVersion: '' },
      },
      ProjectService,
      {
        provide: RwDataService,
        useValue: {
          getMilestone: jest.fn().mockReturnValue(of(null)),
        },
      },
      {
        provide: RwWebsocketService,
        useValue: {
          user: new Subject(),
          workbot: new Subject(),
          connections: new BehaviorSubject(null),
          clearId: jest.fn(),
          pushId: jest.fn(),
          sendView: jest.fn(),
          onIssueEvent: () => of({}),
        },
      },
      {
        provide: UniqueContainerKeyValidator,
        useValue: { validate: () => Promise.resolve(null) },
      },
      {
        provide: RwContainerService,
        useValue: {
          containers: new BehaviorSubject([]),
          getContainerByKey: jest.fn().mockReturnValue(of(null)),
        },
      },
      { provide: RwToastService, useValue: { error: jest.fn() } },
      { provide: RwAlertService, useValue: { confirm: jest.fn() } },
      {
        provide: RenwuSidebarService,
        useValue: {
          scrollToMain: jest.fn(),
          currentTask: new BehaviorSubject(null),
        },
      },
    ],
  });
});
