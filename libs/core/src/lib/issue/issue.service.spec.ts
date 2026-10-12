import { inject, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { RwContainerService } from '../container/container.service';
import { RwDataService } from '../data/data.service';
import { RwSettingsService } from '../settings/settings.service';
import { RwWebsocketService } from '../websocket/websocket.service';
import { RwIssueService } from '../issue/issue.service';

describe('RwIssueService', () => {
  let settingsService: {
    user: { last_used_container?: { id: string; key?: string; title?: string } };
  };
  let containerService: {
    getContainerByKey: jest.Mock;
    getIssueTemplate: jest.Mock;
    getGlobalIssueDefaults: jest.Mock;
  };
  let issueEvents: Subject<{ type: string; issues?: string[] }>;
  let getIssue: jest.Mock;

  beforeEach(() => {
    settingsService = {
      user: {
        last_used_container: {
          id: 'c-last',
          key: 'LAST',
          title: 'Last project',
        },
      },
    };
    containerService = {
      getContainerByKey: jest.fn().mockReturnValue(of(null)),
      getIssueTemplate: jest.fn().mockResolvedValue({
        type: { id: 't1' },
        priority: { id: 'p1' },
        status: { id: 's1' },
        container: { id: 'c-last', key: 'LAST', title: 'Last project' },
      }),
      getGlobalIssueDefaults: jest.fn().mockResolvedValue({
        type: { id: 't1' },
        priority: { id: 'p1' },
        status: { id: 's1' },
      }),
    };
    issueEvents = new Subject();
    getIssue = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        RwIssueService,
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwSettingsService, useValue: settingsService },
        { provide: RwContainerService, useValue: containerService },
        {
          provide: RwWebsocketService,
          useValue: {
            onIssueEvent: () => issueEvents.asObservable(),
            clearId: jest.fn(),
            pushId: jest.fn(),
            sendView: jest.fn(),
            user: new Subject(),
            issue: issueEvents,
            container: new Subject(),
            connections: new Subject(),
            workbot: new Subject(),
          },
        },
        {
          provide: RwDataService,
          useValue: {
            addIssue: jest.fn().mockReturnValue(
              of({ id: '1', key: 'LAST-1', container: settingsService.user.last_used_container }),
            ),
            getIssue,
            getIssueTransitions: jest.fn().mockReturnValue(of([])),
            saveIssue: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    });
  });

  it('should be created', inject(
    [RwIssueService],
    (service: RwIssueService) => {
      expect(service).toBeTruthy();
    },
  ));

  it('prefills last used container when opening new task outside a project', inject(
    [RwIssueService],
    async (service: RwIssueService) => {
      const issue = await service.initIssue({ key: 'new' } as never);
      expect(issue.container).toEqual({
        id: 'c-last',
        key: 'LAST',
        title: 'Last project',
      });
      expect(containerService.getIssueTemplate).toHaveBeenCalledWith('c-last');
    },
  ));

  it('remembers container after create', inject(
    [RwIssueService],
    async (service: RwIssueService) => {
      settingsService.user.last_used_container = undefined;
      service.issueForm.patchValue({
        id: 'new',
        title: 'Task',
        container: { id: 'c-new', key: 'NEW', title: 'New project' },
        estimated_time: 3600,
      });

      await new Promise<void>((resolve, reject) => {
        service.create().subscribe({
          next: () => resolve(),
          error: reject,
        });
      });

      expect(settingsService.user.last_used_container).toEqual({
        id: 'c-new',
        key: 'NEW',
        title: 'New project',
      });
    },
  ));

  it('reloads the issue from the API on websocket update', inject(
    [RwIssueService],
    async (service: RwIssueService) => {
      const first = {
        id: 'iss-1',
        key: 'VKVIDEO-1',
        description: 'old jira',
        status: { id: 's1' },
      };
      const next = {
        ...first,
        description: '## Цель\nAI spec',
      };
      getIssue.mockReturnValueOnce(of(first)).mockReturnValueOnce(of(next));

      const seen: string[] = [];
      const sub = service.issue.subscribe((issue) =>
        seen.push(String(issue.description ?? '')),
      );
      service.key.next('VKVIDEO-1');
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(seen).toEqual(['old jira']);

      issueEvents.next({ type: 'issue_update', issues: ['iss-1'] });
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(getIssue).toHaveBeenCalledTimes(2);
      expect(seen).toEqual(['old jira', '## Цель\nAI spec']);
      sub.unsubscribe();
    },
  ));
});
