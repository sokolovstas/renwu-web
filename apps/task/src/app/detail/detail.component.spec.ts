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

  describe('create shortcuts', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
      component.issueService.issueForm.patchValue({
        id: 'new',
        title: 'New task',
      });
      createSpy = jest.spyOn(component, 'create').mockResolvedValue(undefined);
    });

    function enterEvent(init: KeyboardEventInit = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...init,
      });
    }

    it('creates on Ctrl+Enter', () => {
      component.onCreateShortcut(enterEvent({ ctrlKey: true }));
      expect(createSpy).toHaveBeenCalledWith(false);
    });

    it('creates on Meta+Enter', () => {
      component.onCreateShortcut(enterEvent({ metaKey: true }));
      expect(createSpy).toHaveBeenCalledWith(false);
    });

    it('creates and adds another on Ctrl+Alt+Enter', () => {
      component.onCreateShortcut(enterEvent({ ctrlKey: true, altKey: true }));
      expect(createSpy).toHaveBeenCalledWith(true);
    });

    it('creates on plain Enter when title is not focused', () => {
      const event = enterEvent();
      Object.defineProperty(event, 'target', { value: document.body });
      component.onCreateShortcut(event);
      expect(createSpy).toHaveBeenCalledWith(false);
    });

    it('does not create on plain Enter from title', () => {
      const titleHost = document.createElement('div');
      const input = document.createElement('input');
      titleHost.appendChild(input);
      (
        component as unknown as { titleEl: { nativeElement: HTMLElement } }
      ).titleEl = { nativeElement: titleHost };
      const event = enterEvent();
      Object.defineProperty(event, 'target', { value: input });
      component.onCreateShortcut(event);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('does not create on plain Enter from an input', () => {
      const event = enterEvent();
      Object.defineProperty(event, 'target', {
        value: document.createElement('input'),
      });
      component.onCreateShortcut(event);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('does not create when form is not new', () => {
      component.issueService.issueForm.patchValue({ id: '1' });
      component.onCreateShortcut(enterEvent({ ctrlKey: true }));
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
