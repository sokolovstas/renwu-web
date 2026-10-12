import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwDataService, RwDocument } from '@renwu/core';
import { of, throwError } from 'rxjs';

import { MainComponent } from './main.component';

const sampleDocs: RwDocument[] = [
  {
    id: 'doc-1',
    title: 'Grooming',
    doc: { type: 'doc', content: [] },
    version: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'doc-2',
    title: '',
    doc: { type: 'doc', content: [] },
    version: 1,
    created_at: '',
    updated_at: '',
  },
];

describe('MainComponent', () => {
  let fixture: ComponentFixture<MainComponent>;
  let docsListDocuments: jest.Mock;

  function setup(list$ = of(sampleDocs)): void {
    docsListDocuments = jest.fn().mockReturnValue(list$);
    TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        { provide: RwDataService, useValue: { docsListDocuments } },
      ],
    });
    fixture = TestBed.createComponent(MainComponent);
    fixture.detectChanges();
  }

  it('renders document titles from the API in the sidebar', () => {
    setup();
    expect(docsListDocuments).toHaveBeenCalledWith();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Grooming');
    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    ).map((anchor) => anchor.getAttribute('href') ?? '');
    expect(hrefs.some((href) => href.includes('doc-1'))).toBe(true);
  });

  it('shows an empty state when the API returns no documents', () => {
    setup(of([]));
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('documents.empty');
  });

  it('shows an error state when the list request fails', () => {
    setup(throwError(() => new Error('boom')));
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('documents.list-error');
  });
});
