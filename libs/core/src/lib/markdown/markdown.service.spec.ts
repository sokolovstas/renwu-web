import { provideLocationMocks } from '@angular/common/testing';
import { inject, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwMarkdownService } from './markdown.service';

describe('RwMarkdownService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RwMarkdownService,
        provideRouter([]),
        provideLocationMocks(),
      ],
    });
  });

  it('should be created', inject(
    [RwMarkdownService],
    (service: RwMarkdownService) => {
      expect(service).toBeTruthy();
    },
  ));
});
