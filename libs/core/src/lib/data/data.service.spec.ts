import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RwToastService } from '@renwu/components';

import { RwLoaderService } from '../loader/loader.service';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';
import { RwDataService } from './data.service';

describe('RwDataService', () => {
  let service: RwDataService;
  let http: HttpTestingController;
  let toastError: jest.Mock;

  beforeEach(() => {
    toastError = jest.fn();
    const settings = new RwCoreSettings();
    settings.root = 'localhost';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RwDataService,
        { provide: RwToastService, useValue: { error: toastError } },
        {
          provide: RwLoaderService,
          useValue: { setLoader: () => ({ setProgress: () => undefined }) },
        },
        { provide: RW_CORE_SETTINGS, useValue: settings },
      ],
    });

    service = TestBed.inject(RwDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function notFound(url: string): void {
    const req = http.expectOne(url);
    req.flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('does not toast when an optional jira link 404s', () => {
    let settled = 'pending';
    service.jiraGetIssueLink('issue-1').subscribe({
      next: () => {
        settled = 'value';
      },
      complete: () => {
        if (settled === 'pending') {
          settled = 'empty';
        }
      },
    });

    notFound('http://localhost/api/jira/v1/issue/issue-1/link');

    expect(toastError).not.toHaveBeenCalled();
    expect(settled).toBe('empty');
  });

  it('does not toast when the optional documents list 404s', () => {
    let settled = 'pending';
    service.docsListDocuments('issue-1').subscribe({
      next: () => {
        settled = 'value';
      },
      complete: () => {
        if (settled === 'pending') {
          settled = 'empty';
        }
      },
    });

    const req = http.expectOne(
      (request) =>
        request.url === 'http://localhost/api/documents/v1/documents',
    );
    expect(req.request.params.get('issue_id')).toBe('issue-1');
    req.flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(toastError).not.toHaveBeenCalled();
    expect(settled).toBe('empty');
  });

  it('still toasts Not Found when the issue itself is missing', () => {
    service.getIssue('missing').subscribe();
    notFound('http://localhost/api/core/v1/issue/missing');
    expect(toastError).toHaveBeenCalledWith('Not Found');
  });

  it('emits an empty filter list when saved queries fail to load', () => {
    let list: unknown = 'pending';
    service.getSearchQueries().subscribe((value) => {
      list = value;
    });

    const req = http.expectOne('http://localhost/api/core/v1/search/query');
    req.flush(
      {
        message: 'Internal Server Error',
        error:
          'error decoding key update: cannot decode embedded document into a time.Time',
      },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(list).toEqual([]);
    expect(toastError).not.toHaveBeenCalled();
  });
});
