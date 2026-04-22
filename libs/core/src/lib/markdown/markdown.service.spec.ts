jest.mock('markdown-it/lib/token', () => ({
  __esModule: true,
  default: class MockToken {},
}));

jest.mock('markdown-it', () => ({
  __esModule: true,
  default: class MarkdownItMock {
    core = { ruler: { after: jest.fn() } };
    renderer = { rules: {} as Record<string, unknown> };
    use() {
      return this;
    }
    render() {
      return '';
    }
  },
}));

jest.mock('markdown-it-emoji', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { provideLocationMocks } from '@angular/common/testing';
import { inject, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwMarkdownService } from './markdown.service';

describe('RwMarkdownService', () => {
  beforeEach(() => {
    (globalThis as { emojies_defs?: Record<string, unknown> }).emojies_defs =
      {};
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
