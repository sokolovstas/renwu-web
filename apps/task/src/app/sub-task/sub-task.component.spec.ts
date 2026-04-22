import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwAlertService, RwModalService, RwToastService } from '@renwu/components';
import {
  Issue,
  IssueChilds,
  RwDataService,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import { BehaviorSubject, firstValueFrom, map, of, take, throwError } from 'rxjs';

import { SubTaskComponent } from './sub-task.component';
import { TaskDecompositeModalComponent } from './task-decomposite-modal.component';

let updateFromTemplate: jest.Mock;
let routerNavigate: jest.Mock;

function emptyChilds(): IssueChilds {
  return {
    childs: [],
    childs_completed_total: 0,
    childs_estimated_total: 0,
    childs_resolved: 0,
    childs_total: 0,
  };
}

function createIssueForm(issue: Issue): FormGroup {
  const defaultContainer = { id: 'c1', key: 'c', title: 'C', archived: false };
  const containerValue = Object.prototype.hasOwnProperty.call(
    issue,
    'container',
  )
    ? (issue.container ?? null)
    : defaultContainer;
  return new FormGroup({
    id: new FormControl<string>(String(issue.id ?? 'new')),
    key: new FormControl<string>(String(issue.key ?? 'new')),
    container: new FormControl<{ id: string; key?: string; title?: string; archived?: boolean } | null>(
      containerValue,
    ),
  });
}

describe('SubTaskComponent', () => {
  let fixture: ComponentFixture<SubTaskComponent>;
  let component: SubTaskComponent;
  let issue$: BehaviorSubject<Issue>;
  let dataService: { getChildIssues: jest.Mock; getIssue: jest.Mock; saveIssue: jest.Mock };
  let policyService: { canEditIssue: jest.Mock };
  let alertService: { confirm: jest.Mock };
  let toastService: { error: jest.Mock; info: jest.Mock };
  let issueForm: FormGroup;
  let patchIssue: jest.Mock;
  let setPrevState: jest.Mock;
  let modalService: { add: jest.Mock };

  const sampleChilds: IssueChilds = {
    childs: [
      {
        id: '10',
        key: 'P-10',
        title: 'Child A',
        status: { id: 'open' } as Issue['status'],
      } as Issue,
    ],
    childs_completed_total: 0,
    childs_estimated_total: 3600,
    childs_resolved: 0,
    childs_total: 1,
  };

  function createComponent(
    issue: Issue,
    options?: {
      policyReturns?: boolean;
      childIssues$?: ReturnType<typeof of<IssueChilds>>;
      confirm$?: ReturnType<typeof of<{ affirmative: boolean }>>;
    },
  ): void {
    issue$ = new BehaviorSubject<Issue>(issue);
    issueForm = createIssueForm(issue);
    patchIssue = jest.fn();
    setPrevState = jest.fn();
    dataService = {
      getChildIssues: jest
        .fn()
        .mockReturnValue(options?.childIssues$ ?? of(sampleChilds)),
      getIssue: jest.fn(),
      saveIssue: jest.fn().mockReturnValue(of({})),
    };
    policyService = {
      canEditIssue: jest
        .fn()
        .mockReturnValue(of(options?.policyReturns ?? true)),
    };
    alertService = {
      confirm: jest
        .fn()
        .mockReturnValue(options?.confirm$ ?? of({ affirmative: true })),
    };
    toastService = { error: jest.fn(), info: jest.fn() };
    updateFromTemplate = jest.fn();
    routerNavigate = jest.fn().mockResolvedValue(true);
    modalService = {
      add: jest.fn().mockReturnValue({}),
    };

    const issueService: Pick<
      RwIssueService,
      | 'newIssue'
      | 'issue'
      | 'issueForm'
      | 'patchIssue'
      | 'setPrevState'
      | 'updateFromTemplate'
    > = {
      newIssue: issue$.pipe(map((p) => p.id === 'new')),
      issue: issue$.asObservable(),
      issueForm,
      patchIssue,
      setPrevState,
      updateFromTemplate,
    };

    TestBed.configureTestingModule({
      imports: [SubTaskComponent],
      providers: [
        { provide: RwIssueService, useValue: issueService },
        { provide: RwDataService, useValue: dataService },
        { provide: RwPolicyService, useValue: policyService },
        { provide: RwAlertService, useValue: alertService },
        { provide: RwToastService, useValue: toastService },
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: RwModalService, useValue: modalService },
        { provide: TranslocoService, useValue: new TranslocoService() },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(SubTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent({ id: '1', key: 'P-1' });
    expect(component).toBeTruthy();
  });

  it('does not call getChildIssues for new issue', async () => {
    createComponent({ id: 'new', key: 'new' });
    const data = await firstValueFrom(component.childData$.pipe(take(1)));
    expect(data.childs).toEqual([]);
    expect(dataService.getChildIssues).not.toHaveBeenCalled();
  });

  it('loads children for persisted issue', async () => {
    createComponent({ id: '42', key: 'P-42' });
    const data = await firstValueFrom(component.childData$.pipe(take(1)));
    expect(dataService.getChildIssues).toHaveBeenCalledWith('42');
    expect(data.childs.length).toBe(1);
    expect(data.childs[0].key).toBe('P-10');
  });

  it('falls back to empty child list when getChildIssues fails', async () => {
    createComponent({ id: '7', key: 'P-7' }, {
      childIssues$: throwError(() => new Error('network')),
    });
    const data = await firstValueFrom(component.childData$.pipe(take(1)));
    expect(data.childs).toEqual([]);
    expect(dataService.getChildIssues).toHaveBeenCalledWith('7');
  });

  describe('addChild', () => {
    it('shows toast when container is missing', async () => {
      createComponent({ id: '1', key: 'P-1', container: null } as Issue);
      await component.addChild();
      expect(toastService.info).toHaveBeenCalledWith(
        'task.subtask-add-no-container',
      );
      expect(routerNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when user cannot edit', async () => {
      createComponent(
        {
          id: '1',
          key: 'P-1',
          container: { id: 'c1', key: 'k', title: 't', archived: false },
        },
        { policyReturns: false },
      );
      await component.addChild();
      expect(routerNavigate).not.toHaveBeenCalled();
    });

    it('navigates to new task and applies parent link from template', async () => {
      jest.useFakeTimers();
      const container = {
        id: 'cont-1',
        key: 'CK',
        title: 'Proj',
        archived: false,
      };
      createComponent({
        id: '1',
        key: 'P-1',
        container,
        title: 'Parent title',
        status: { id: 's1' } as Issue['status'],
      });
      await component.addChild();
      expect(routerNavigate).toHaveBeenCalledWith([
        { outlets: { section: ['task', 'new'] } },
      ]);
      expect(updateFromTemplate).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(updateFromTemplate).toHaveBeenCalledTimes(1);
      const arg = updateFromTemplate.mock.calls[0][0] as Issue;
      expect(arg.container).toEqual(container);
      expect(arg.links?.parent?.[0].id).toBe('1');
      expect(arg.links?.parent?.[0].key).toBe('P-1');
      jest.useRealTimers();
    });
  });

  describe('openDecomposite', () => {
    it('shows toast when container is missing', async () => {
      createComponent({ id: '1', key: 'P-1', container: null } as Issue);
      await component.openDecomposite();
      expect(toastService.info).toHaveBeenCalledWith(
        'task.subtask-add-no-container',
      );
      expect(modalService.add).not.toHaveBeenCalled();
    });

    it('does not open modal when user cannot edit', async () => {
      createComponent(
        {
          id: '1',
          key: 'P-1',
          container: { id: 'c1', key: 'k', title: 't', archived: false },
        },
        { policyReturns: false },
      );
      await component.openDecomposite();
      expect(modalService.add).not.toHaveBeenCalled();
    });

    it('opens decomposite modal with current issue', async () => {
      const issue = {
        id: '1',
        key: 'P-1',
        container: { id: 'c1', key: 'k', title: 't', archived: false },
      } as Issue;
      createComponent(issue);
      await component.openDecomposite();
      expect(modalService.add).toHaveBeenCalledWith(
        TaskDecompositeModalComponent,
        expect.objectContaining({
          issueParent: issue,
          afterCreate: expect.any(Function),
        }),
      );
    });
  });

  describe('unlinkChild', () => {
    const child: Issue = {
      id: '10',
      key: 'P-10',
      title: 'Child',
    } as Issue;

    it('returns early when parent is new', async () => {
      createComponent({ id: 'new', key: 'new' });
      await component.unlinkChild(child);
      expect(alertService.confirm).not.toHaveBeenCalled();
    });

    it('does not confirm when user cannot edit', async () => {
      createComponent({ id: '1', key: 'P-1' }, { policyReturns: false });
      await component.unlinkChild(child);
      expect(alertService.confirm).not.toHaveBeenCalled();
    });

    it('returns when confirm dismissed', async () => {
      createComponent({ id: '1', key: 'P-1' }, {
        confirm$: of({ affirmative: false }),
      });
      await component.unlinkChild(child);
      expect(alertService.confirm).toHaveBeenCalled();
      expect(dataService.getIssue).not.toHaveBeenCalled();
    });

    it('reloads parent and refreshes list on successful unlink', async () => {
      createComponent({ id: '1', key: 'P-1' });
      const childIssue: Issue = {
        id: '10',
        key: 'P-10',
        title: 'Child',
        links: {
          parent: [{ id: '1', key: 'P-1', title: 'P' } as Issue],
          related: [],
          prev_issue: [],
          next_issue: [],
        },
      } as Issue;
      const freshParent: Issue = {
        id: '1',
        key: 'P-1',
        title: 'Parent',
        have_childs: false,
      } as Issue;

      let getIssueCalls = 0;
      dataService.getIssue = jest.fn().mockImplementation(() => {
        getIssueCalls += 1;
        if (getIssueCalls === 1) {
          return of(childIssue);
        }
        return of(freshParent);
      });

      await component.unlinkChild(child);

      expect(dataService.saveIssue).toHaveBeenCalled();
      expect(patchIssue).toHaveBeenCalledWith(freshParent, { reset: true });
      expect(setPrevState).toHaveBeenCalled();
      expect(dataService.getChildIssues).toHaveBeenCalledWith('1');
    });

    it('shows error toast when save fails', async () => {
      createComponent({ id: '1', key: 'P-1' });
      const childIssue: Issue = {
        id: '10',
        links: {
          parent: [{ id: '1' } as Issue],
          related: [],
          prev_issue: [],
          next_issue: [],
        },
      } as Issue;
      dataService.getIssue = jest.fn().mockReturnValue(of(childIssue));
      dataService.saveIssue = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('save failed')));

      await component.unlinkChild(child);

      expect(toastService.error).toHaveBeenCalledWith('task.subtask-mutation-error');
      expect(patchIssue).not.toHaveBeenCalled();
    });
  });

  describe('hasProgress', () => {
    it('is false when childs_total is zero', () => {
      createComponent({ id: '1', key: 'P-1' });
      expect(component.hasProgress(emptyChilds())).toBe(false);
    });

    it('is true when childs_total is positive', () => {
      createComponent({ id: '1', key: 'P-1' });
      expect(component.hasProgress(sampleChilds)).toBe(true);
    });
  });
});
