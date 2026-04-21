jest.mock('@jsverse/transloco', () => {
  const s = require('../../testing/transloco-stub');
  return {
    TranslocoPipe: s.TranslocoPipeStub,
    TranslocoService: s.TranslocoServiceStub,
  };
});

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { RwAlertService, RwToastService } from '@renwu/components';
import {
  Issue,
  IssueLink,
  IssueLinks,
  RwDataService,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import { BehaviorSubject, Observable, map, of, throwError } from 'rxjs';

import { RelatedComponent } from './related.component';

function emptyLinks(): IssueLinks {
  return {
    parent: [],
    related: [],
    prev_issue: [],
    next_issue: [],
  };
}

function createIssueForm(issue: Issue, links: IssueLinks): FormGroup {
  return new FormGroup({
    id: new FormControl<string>(String(issue.id ?? 'new')),
    key: new FormControl<string>(String(issue.key ?? 'new')),
    container: new FormControl<{ id: string } | null>(
      issue.container ?? { id: 'c1' },
    ),
    links: new FormControl<IssueLinks>(links, { nonNullable: true }),
  });
}

const loadedIssue: Issue = {
  id: '99',
  key: 'PROJ-99',
  title: 'Linked task',
  have_childs: false,
  date_start: '',
  date_end: '',
  status: { id: 'open' } as Issue['status'],
};

describe('RelatedComponent', () => {
  let fixture: ComponentFixture<RelatedComponent>;
  let component: RelatedComponent;
  let issue$: BehaviorSubject<Issue>;
  let toastService: { info: jest.Mock; error: jest.Mock };
  let alertService: { confirm: jest.Mock };
  let dataService: { getIssue: jest.Mock };
  let policyService: { canEditIssue: jest.Mock };
  let issueForm: FormGroup;

  function createComponent(
    issue: Issue,
    links: IssueLinks = emptyLinks(),
    options?: {
      policyReturns?: boolean;
      getIssue$?: Observable<Issue>;
      confirm$?: Observable<{ affirmative: boolean }>;
    },
  ): void {
    issue$ = new BehaviorSubject<Issue>(issue);
    issueForm = createIssueForm(issue, links);
    toastService = {
      info: jest.fn(),
      error: jest.fn(),
    };
    alertService = {
      confirm: jest
        .fn()
        .mockReturnValue(options?.confirm$ ?? of({ affirmative: true })),
    };
    dataService = {
      getIssue: jest
        .fn()
        .mockReturnValue(options?.getIssue$ ?? of(loadedIssue)),
    };
    policyService = {
      canEditIssue: jest
        .fn()
        .mockReturnValue(of(options?.policyReturns ?? true)),
    };

    const issueService: Pick<
      RwIssueService,
      'newIssue' | 'issue' | 'issueForm'
    > = {
      newIssue: issue$.pipe(map((p) => p.id === 'new')),
      issue: issue$.asObservable(),
      issueForm,
    };

    TestBed.configureTestingModule({
      imports: [RelatedComponent],
      providers: [
        { provide: RwIssueService, useValue: issueService },
        { provide: RwDataService, useValue: dataService },
        { provide: RwToastService, useValue: toastService },
        { provide: RwAlertService, useValue: alertService },
        { provide: RwPolicyService, useValue: policyService },
        { provide: TranslocoService, useValue: new TranslocoService() },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(RelatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create with persisted issue', () => {
    createComponent({ id: '1', key: 'PROJ-1' });
    expect(component).toBeTruthy();
  });

  describe('add', () => {
    it('shows save-first toast when issue is new', async () => {
      createComponent({ id: 'new', key: 'new' });
      component.addKey = 'PROJ-2';
      await component.add();
      expect(toastService.info).toHaveBeenCalledWith('task.related-save-first');
      expect(dataService.getIssue).not.toHaveBeenCalled();
    });

    it('does not fetch when user cannot edit', async () => {
      createComponent({ id: '1', key: 'PROJ-1' }, emptyLinks(), {
        policyReturns: false,
      });
      component.addKey = 'PROJ-2';
      await component.add();
      expect(dataService.getIssue).not.toHaveBeenCalled();
    });

    it('shows duplicate toast when key already linked', async () => {
      const links = emptyLinks();
      links.related = [
        {
          id: '2',
          key: 'PROJ-2',
          title: 'x',
          have_childs: false,
          date_start: '',
          date_end: '',
          status: { id: 'o' } as Issue['status'],
        },
      ];
      createComponent({ id: '1', key: 'PROJ-1' }, links);
      component.addKey = 'PROJ-2';
      await component.add();
      expect(toastService.info).toHaveBeenCalledWith('task.related-duplicate');
      expect(dataService.getIssue).not.toHaveBeenCalled();
    });

    it('shows self toast when key matches current issue', async () => {
      createComponent({ id: '1', key: 'PROJ-1' });
      component.addKey = 'PROJ-1';
      await component.add();
      expect(toastService.info).toHaveBeenCalledWith('task.related-self');
      expect(dataService.getIssue).not.toHaveBeenCalled();
    });

    it('shows not-found toast when getIssue fails', async () => {
      createComponent({ id: '1', key: 'PROJ-1' }, emptyLinks(), {
        getIssue$: throwError(() => new Error('404')),
      });
      component.addKey = 'PROJ-404';
      await component.add();
      expect(toastService.error).toHaveBeenCalledWith('task.related-not-found');
    });

    it('appends link and clears input on success', async () => {
      createComponent({ id: '1', key: 'PROJ-1' });
      component.addKey = 'PROJ-99';
      await component.add();
      const related = issueForm.getRawValue().links.related ?? [];
      expect(related.some((r) => r.key === 'PROJ-99')).toBe(true);
      expect(component.addKey).toBe('');
      expect(dataService.getIssue).toHaveBeenCalledWith('PROJ-99');
    });
  });

  describe('remove', () => {
    const link: IssueLink = {
      id: '2',
      key: 'PROJ-2',
      title: 'Other',
      have_childs: false,
      date_start: '',
      date_end: '',
      status: { id: 'o' } as Issue['status'],
    };

    it('does not confirm when user cannot edit', async () => {
      const links = emptyLinks();
      links.related = [link];
      createComponent({ id: '1', key: 'PROJ-1' }, links, {
        policyReturns: false,
      });
      await component.remove(link);
      expect(alertService.confirm).not.toHaveBeenCalled();
      expect(issueForm.getRawValue().links.related?.length).toBe(1);
    });

    it('keeps links when confirm is dismissed', async () => {
      const links = emptyLinks();
      links.related = [link];
      createComponent({ id: '1', key: 'PROJ-1' }, links, {
        confirm$: of({ affirmative: false }),
      });
      await component.remove(link);
      expect(alertService.confirm).toHaveBeenCalled();
      expect(issueForm.getRawValue().links.related?.length).toBe(1);
    });

    it('removes link when confirm is accepted', async () => {
      const links = emptyLinks();
      links.related = [link];
      createComponent({ id: '1', key: 'PROJ-1' }, links);
      await component.remove(link);
      expect(issueForm.getRawValue().links.related ?? []).toEqual([]);
    });
  });
});
