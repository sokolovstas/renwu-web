import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RwMarkdownService } from './markdown.service';

describe('RwMarkdownService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [RwMarkdownService],
    });
  });

  it('should be created', inject(
    [RwMarkdownService],
    (service: RwMarkdownService) => {
      expect(service).toBeTruthy();
    },
  ));
});
