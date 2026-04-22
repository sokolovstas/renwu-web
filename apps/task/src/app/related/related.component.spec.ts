import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { RW_SELECT_MODELS, RwAlertService, RwToastService } from '@renwu/components';
import {
  Issue,
  IssueLink,
  IssueLinks,
  RwDataService,
  RwIssueService,
  RwPolicyService,
  SelectModelIssueLink,
} from '@renwu/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

import { RelatedComponent } from './related.component';
import { provideTranslocoStub } from '../../testing/transloco-stub';

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

const pickIssue: Issue = {
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
  let policyService: { canEditIssue: jest.Mock };
  let issueForm: FormGroup;

  function createComponent(
    issue: Issue,
    links: IssueLinks = emptyLinks(),
    options?: {
      policyReturns?: boolean;
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
        provideTranslocoStub(),
        { provide: RwIssueService, useValue: issueService },
        {
          provide: RwDataService,
          useValue: {
            getDictionaryOptions: jest
              .fn()
              .mockReturnValue(
                of({ results: [], next: null, count: 0, previous: null }),
              ),
          },
        },
        {
          provide: RW_SELECT_MODELS,
          useValue: {
            IssueLink: () => new SelectModelIssueLink(),
          },
        },
        { provide: RwToastService, useValue: toastService },
        { provide: RwAlertService, useValue: alertService },
        { provide: RwPolicyService, useValue: policyService },
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

  describe('addIssue', () => {
    it('shows save-first toast when issue is new', async () => {
      createComponent({ id: 'new', key: 'new' });
      await component.addIssue(pickIssue);
      expect(toastService.info).toHaveBeenCalledWith('task.related-save-first');
    });

    it('does not mutate when user cannot edit', async () => {
      createComponent({ id: '1', key: 'PROJ-1' }, emptyLinks(), {
        policyReturns: false,
      });
      await component.addIssue(pickIssue);
      expect(toastService.info).not.toHaveBeenCalled();
      expect(issueForm.getRawValue().links.related ?? []).toEqual([]);
    });

    it('shows duplicate when key already in links.parent', async () => {
      const links = emptyLinks();
      links.parent = [
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
      await component.addIssue({
        ...pickIssue,
        id: '2',
        key: 'PROJ-2',
      } as Issue);
      expect(toastService.info).toHaveBeenCalledWith('task.related-duplicate');
    });

    it('shows duplicate when key already in related', async () => {
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
      await component.addIssue({
        ...pickIssue,
        id: '2',
        key: 'PROJ-2',
      } as Issue);
      expect(toastService.info).toHaveBeenCalledWith('task.related-duplicate');
    });

    it('shows self toast when key matches current issue', async () => {
      createComponent({ id: '1', key: 'PROJ-1' });
      await component.addIssue({
        ...pickIssue,
        key: 'PROJ-1',
        id: '1',
      } as Issue);
      expect(toastService.info).toHaveBeenCalledWith('task.related-self');
    });

    it('appends link on success', async () => {
      createComponent({ id: '1', key: 'PROJ-1' });
      await component.addIssue(pickIssue);
      const related = issueForm.getRawValue().links.related ?? [];
      expect(related.some((r) => r.key === 'PROJ-99')).toBe(true);
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
