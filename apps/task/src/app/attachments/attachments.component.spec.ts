import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  RwAlertService,
  RwModalService,
  RwToastService,
} from '@renwu/components';
import { RwMessageService } from '@renwu/messaging';
import {
  RW_CORE_SETTINGS,
  RwCoreSettings,
  RwDataService,
  RwPolicyService,
} from '@renwu/core';
import { of } from 'rxjs';

import { AttachmentsComponent } from './attachments.component';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';
import { provideTranslocoStub } from '../../testing/transloco-stub';

describe('AttachmentsComponent', () => {
  let component: AttachmentsComponent;
  let fixture: ComponentFixture<AttachmentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AttachmentsComponent],
      providers: [
        provideTranslocoStub(),
        provideRwIssueServiceShellMock(),
        { provide: RwDataService, useValue: { addIssueAttachment: jest.fn(), deleteIssueAttachment: jest.fn() } },
        { provide: RwPolicyService, useValue: { canEditIssue: jest.fn().mockReturnValue(of(true)) } },
        { provide: RwAlertService, useValue: { confirm: jest.fn().mockReturnValue(of({ affirmative: true })) } },
        {
          provide: RwToastService,
          useValue: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
        },
        {
          provide: RwModalService,
          useValue: {
            add: jest.fn().mockReturnValue({
              deleteImage: { pipe: () => ({ subscribe: jest.fn() }) },
            }),
            close: jest.fn(),
          },
        },
        {
          provide: RwMessageService,
          useValue: {
            postFileMessage: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: RW_CORE_SETTINGS,
          useValue: {
            mediaUrl: 'http://media',
            rootApiUrl: 'http://api',
          } as RwCoreSettings,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(AttachmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
