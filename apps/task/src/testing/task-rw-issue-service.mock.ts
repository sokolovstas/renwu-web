import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Attachment,
  ContainerD,
  Issue,
  IssueLinks,
  MilestoneD,
  Priority,
  RwIssueService,
  Status,
  TimeLog,
  Type,
  UserD,
} from '@renwu/core';
import { BehaviorSubject, Subject, map, of } from 'rxjs';

/**
 * Issue form shape aligned with `RwIssueService.issueForm` so task shell templates
 * (`detail`, attachments, time-log, …) can run under tests without the real service.
 */
export function createShellIssueForm(): FormGroup {
  return new FormGroup({
    id: new FormControl('1'),
    todos: new FormArray<
      FormGroup<{
        is_done: FormControl<boolean>;
        description: FormControl<string>;
      }>
    >([]),
    fav_users: new FormControl<string[]>([]),
    key: new FormControl('P-1'),
    title: new FormControl('Ti', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    container: new FormControl<ContainerD>(
      { id: 'c1', title: 'C', key: 'c', archived: false },
      { validators: [Validators.required] },
    ),
    milestones: new FormControl<MilestoneD[] | null>(null),
    type: new FormControl<Type | null>(null),
    priority: new FormControl<Priority | null>(null),
    status: new FormControl<Status | null>({
      id: 'open',
      label: 'Open',
      color: '#999',
    } as Status),
    labels: new FormControl<string[]>([]),
    affected_versions: new FormControl<MilestoneD[] | null>(null),
    assignes: new FormControl<UserD[]>([]),
    watchers: new FormControl<UserD[]>([]),
    description: new FormControl(''),
    estimated_time: new FormControl(4 * 60 * 60, {
      validators: [Validators.required, Validators.min(1)],
    }),
    links: new FormControl<IssueLinks>(
      {
        parent: [],
        related: [],
        prev_issue: [],
        next_issue: [],
      },
      { nonNullable: true },
    ),
    attachments: new FormControl<Attachment[]>([], { nonNullable: true }),
    time_logs: new FormControl<TimeLog[]>([], { nonNullable: true }),
    time_logged: new FormControl<number>(0, { nonNullable: true }),
    completion: new FormControl<number>(0, { nonNullable: true }),
    have_childs: new FormControl<boolean>(false, { nonNullable: true }),
  });
}

export function createRwIssueServiceShellMock(issuePatch: Partial<Issue> = {}): {
  /** Narrow surface used by task shell specs; cast when passing to `provide`. */
  mock: Partial<RwIssueService>;
  issue$: BehaviorSubject<Issue>;
} {
  const issueForm = createShellIssueForm();
  const raw = issueForm.getRawValue();
  const baseIssue: Issue = {
    id: raw.id,
    key: raw.key,
    title: raw.title,
    container: raw.container ?? undefined,
    status: raw.status ?? undefined,
    ...issuePatch,
  } as Issue;
  const issue$ = new BehaviorSubject<Issue>(baseIssue);
  const mock = {
    issue: issue$.asObservable(),
    issueForm,
    newIssue: issue$.pipe(map((p) => p.id === 'new')),
    key: new Subject<string>(),
    patchIssue: jest.fn(),
    setPrevState: jest.fn(),
    updateFromTemplate: jest.fn(),
    favorite: of(false),
    watchingSelf: of(false),
    transitions: of([]),
    create: jest.fn().mockReturnValue(of({ key: 'NEW-1' })),
    delete: jest.fn().mockReturnValue(of(false)),
    changeIssueStatus: jest.fn(),
    setFavorite: jest.fn().mockReturnValue(of(null)),
    toggleWatchingSelf: jest.fn().mockReturnValue(of(null)),
  };
  return { mock, issue$: issue$ };
}

export function provideRwIssueServiceShellMock(issuePatch?: Partial<Issue>): {
  provide: typeof RwIssueService;
  useValue: RwIssueService;
} {
  const { mock } = createRwIssueServiceShellMock(issuePatch);
  return { provide: RwIssueService, useValue: mock as unknown as RwIssueService };
}
