import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RwModalService, RwToastService } from '@renwu/components';
import { RwPolicyService } from '@renwu/core';
import { of } from 'rxjs';

import { TimeLogComponent } from './time-log.component';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';
import { provideTranslocoStub } from '../../testing/transloco-stub';

describe('TimeLogComponent', () => {
  let component: TimeLogComponent;
  let fixture: ComponentFixture<TimeLogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimeLogComponent],
      providers: [
        provideTranslocoStub(),
        provideRwIssueServiceShellMock(),
        { provide: RwPolicyService, useValue: { canEditIssue: jest.fn().mockReturnValue(of(true)) } },
        { provide: RwToastService, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: RwModalService, useValue: { add: jest.fn().mockReturnValue({}), close: jest.fn() } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(TimeLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
