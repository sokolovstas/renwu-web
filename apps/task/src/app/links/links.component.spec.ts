import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RW_SELECT_MODELS, RwAlertService, RwToastService } from '@renwu/components';
import {
  Issue,
  IssueLinks,
  RwDataService,
  RwIssueService,
  RwPolicyService,
  SelectModelIssueLink,
} from '@renwu/core';
import { BehaviorSubject, map, of } from 'rxjs';

import { LinksComponent } from './links.component';
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

const loaded: Issue = {
  id: '88',
  key: 'PROJ-88',
  title: 'Other',
  have_childs: false,
  date_start: '',
  date_end: '',
  status: { id: 'open' } as Issue['status'],
};

describe('LinksComponent', () => {
  let fixture: ComponentFixture<LinksComponent>;
  let component: LinksComponent;
  let issue$: BehaviorSubject<Issue>;
  let issueForm: FormGroup;

  beforeEach(() => {
    issue$ = new BehaviorSubject<Issue>({ id: '1', key: 'PROJ-1' } as Issue);
    issueForm = createIssueForm({ id: '1', key: 'PROJ-1' } as Issue, emptyLinks());
    const issueService: Pick<RwIssueService, 'newIssue' | 'issue' | 'issueForm'> = {
      newIssue: issue$.pipe(map((p) => p.id === 'new')),
      issue: issue$.asObservable(),
      issueForm,
    };
    TestBed.configureTestingModule({
      imports: [LinksComponent],
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
        { provide: RwToastService, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: RwAlertService, useValue: { confirm: jest.fn().mockReturnValue(of({ affirmative: true })) } },
        { provide: RwPolicyService, useValue: { canEditIssue: jest.fn().mockReturnValue(of(true)) } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(LinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds parent link from picked issue', async () => {
    await component.addIssue('parent', loaded);
    expect(issueForm.getRawValue().links.parent?.some((p) => p.key === 'PROJ-88')).toBe(
      true,
    );
  });
});
