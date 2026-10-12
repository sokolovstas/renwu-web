import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RwDataService, RwDocument } from '@renwu/core';
import { of, throwError } from 'rxjs';

import { TaskDocumentsComponent } from './documents.component';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';
import { provideTranslocoStub } from '../../testing/transloco-stub';

const sampleDoc: RwDocument = {
  id: 'doc-1',
  title: 'Grooming — результат',
  issue_id: '1',
  doc: { type: 'doc', content: [] },
  version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('TaskDocumentsComponent', () => {
  let component: TaskDocumentsComponent;
  let fixture: ComponentFixture<TaskDocumentsComponent>;
  let docsListDocuments: jest.Mock;

  function setup(): void {
    fixture = TestBed.createComponent(TaskDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    docsListDocuments = jest.fn().mockReturnValue(of([sampleDoc]));
    TestBed.configureTestingModule({
      imports: [TaskDocumentsComponent],
      providers: [
        provideTranslocoStub(),
        provideRwIssueServiceShellMock(),
        { provide: RwDataService, useValue: { docsListDocuments } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
  });

  it('fetches documents for the current issue id', (done) => {
    setup();
    component.documents$.subscribe((docs) => {
      expect(docsListDocuments).toHaveBeenCalledWith('1');
      expect(docs).toEqual([sampleDoc]);
      done();
    });
  });

  it('emits null (not an empty list) when the fetch fails, to render the error state', (done) => {
    docsListDocuments.mockReturnValue(throwError(() => new Error('boom')));
    setup();
    component.documents$.subscribe((docs) => {
      expect(docs).toBeNull();
      done();
    });
  });

  it('opens the document in a new tab', () => {
    setup();
    const openSpy = jest.spyOn(globalThis, 'open').mockImplementation(() => null);
    component.openDocument(sampleDoc);
    expect(openSpy).toHaveBeenCalledWith(
      '/document/doc-1',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });
});
