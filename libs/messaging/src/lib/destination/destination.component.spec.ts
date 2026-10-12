import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwToastService } from '@renwu/components';
import {
  Issue,
  RwDataService,
  RwIssueService,
  RwUserService,
  Status,
  WorkflowTransition,
} from '@renwu/core';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { DestinationType } from '../data/messages.model';
import { MessageDestination } from '../message-destination';
import { RwMessageService } from '../message.service';
import { DestinationComponent } from './destination.component';

describe('DestinationComponent', () => {
  let fixture: ComponentFixture<DestinationComponent>;
  let dataService: {
    getIssueTransitions: jest.Mock;
    changeStatusIssue: jest.Mock;
    getIssue: jest.Mock;
  };
  let toast: { success: jest.Mock; error: jest.Mock };

  const openStatus = {
    id: 'open',
    label: 'Open',
    color: '#00f',
    symbol: 'OP',
  } as Status;
  const doneStatus = {
    id: 'done',
    label: 'Done',
    color: '#0f0',
    symbol: 'DN',
  } as Status;
  const issue: Issue = {
    id: 'issue-1',
    key: 'X-1',
    title: 'Task',
    status: openStatus,
  };

  function issueDestination(item: Issue): MessageDestination {
    return {
      type: DestinationType.ISSUE,
      item: new BehaviorSubject(item),
      updateInfo: jest.fn(),
      info: {
        name: item.key,
        issue: item,
        destination: { type: DestinationType.ISSUE, id: item.id },
      },
    } as unknown as MessageDestination;
  }

  beforeEach(async () => {
    dataService = {
      getIssueTransitions: jest.fn().mockReturnValue(of([])),
      changeStatusIssue: jest.fn().mockReturnValue(of({})),
      getIssue: jest.fn().mockReturnValue(of(null)),
    };
    toast = { success: jest.fn(), error: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [DestinationComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwMessageService, useValue: {} },
        { provide: RwUserService, useValue: {} },
        { provide: RwDataService, useValue: dataService },
        {
          provide: RwIssueService,
          useValue: {
            issueForm: { getRawValue: () => ({}) },
            patchIssue: jest.fn(),
          },
        },
        { provide: RwToastService, useValue: toast },
        {
          provide: TranslocoService,
          useValue: { translate: (k: string) => k },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DestinationComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads transitions for an issue header', async () => {
    const transitions: WorkflowTransition[] = [
      { label: 'Done', step: openStatus, to: doneStatus },
    ];
    dataService.getIssueTransitions.mockReturnValue(of(transitions));
    fixture.componentInstance.showStatusActions = true;
    fixture.componentInstance.destination = issueDestination(issue);

    await expect(
      firstValueFrom(fixture.componentInstance.transitions$),
    ).resolves.toEqual(transitions);
    expect(dataService.getIssueTransitions).toHaveBeenCalledWith('issue-1');
  });

  it('does not load transitions in the sidebar list', async () => {
    fixture.componentInstance.showStatusActions = false;
    fixture.componentInstance.destination = issueDestination(issue);

    await expect(
      firstValueFrom(fixture.componentInstance.transitions$),
    ).resolves.toEqual([]);
    expect(dataService.getIssueTransitions).not.toHaveBeenCalled();
  });

  it('transits an issue and refreshes the destination', async () => {
    const fresh: Issue = { ...issue, status: doneStatus };
    dataService.getIssue.mockReturnValue(of(fresh));
    const dest = issueDestination(issue);
    fixture.componentInstance.showStatusActions = true;
    fixture.componentInstance.destination = dest;
    const t: WorkflowTransition = {
      label: 'Done',
      step: openStatus,
      to: doneStatus,
    };

    await fixture.componentInstance.transit(issue, t);

    expect(dataService.changeStatusIssue).toHaveBeenCalledWith(
      'issue-1',
      doneStatus,
    );
    expect(dataService.getIssue).toHaveBeenCalledWith('issue-1');
    expect(dest.item.getValue()).toEqual(fresh);
    expect(toast.success).toHaveBeenCalled();
  });
});
