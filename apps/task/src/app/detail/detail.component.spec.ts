import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RenwuSidebarService } from '@renwu/app-ui';
import { RwToastService } from '@renwu/components';
import { RwSettingsService, StateService } from '@renwu/core';
import { RwMessageService } from '@renwu/messaging';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { DetailComponent } from './detail.component';
import { TaskDetailVisibilityService } from '../task-detail-layout/task-detail-visibility.service';
import { TaskSectionConfig } from '../task-sections/task-section.model';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';
import { provideTranslocoStub } from '../../testing/transloco-stub';

describe('DetailComponent', () => {
  let component: DetailComponent;
  let fixture: ComponentFixture<DetailComponent>;
  const fetchMock = jest.fn();

  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  beforeEach(async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ sections: [] as TaskSectionConfig[] }),
    } as Response);

    const userUpdated = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideTranslocoStub(),
        provideRwIssueServiceShellMock(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ key: 'P-1' })),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: RwToastService,
          useValue: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
        },
        {
          provide: RwMessageService,
          useValue: {
            getDestination: jest.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: RenwuSidebarService,
          useValue: { currentTask: new BehaviorSubject(null) },
        },
        { provide: StateService, useValue: {} },
        {
          provide: TaskDetailVisibilityService,
          useValue: {
            isVisible: () => true,
            filterSections: (sections: TaskSectionConfig[]) => sections ?? [],
          },
        },
        {
          provide: RwSettingsService,
          useValue: {
            user: {
              updated: userUpdated.asObservable(),
              isTaskDetailFieldVisible: () => true,
            },
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
