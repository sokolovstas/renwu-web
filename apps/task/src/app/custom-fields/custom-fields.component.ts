import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwIssueService } from '@renwu/core';
import { map, shareReplay } from 'rxjs';

export interface CustomFieldLinkItem {
  title: string;
  url: string;
  relationship?: string;
  application?: string;
  summary?: string;
}

export interface CustomFieldView {
  key: string;
  labelKey?: string;
  links?: CustomFieldLinkItem[];
  text?: string;
}

@Component({
  selector: 'renwu-task-custom-fields',
  standalone: true,
  imports: [AsyncPipe, TranslocoPipe],
  templateUrl: './custom-fields.component.html',
  styleUrl: './custom-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomFieldsComponent {
  private issueService = inject(RwIssueService);

  readonly fields$ = this.issueService.issue.pipe(
    map((issue) => normalizeCustomFields(issue?.custom_fields)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  openLink(url: string): void {
    if (!url) {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function normalizeCustomFields(
  raw: Record<string, unknown> | undefined | null,
): CustomFieldView[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const out: CustomFieldView[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value == null || value === '') {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    const links = asLinkItems(value);
    if (links?.length) {
      out.push({
        key,
        labelKey: labelKeyFor(key),
        links,
      });
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out.push({
        key,
        labelKey: labelKeyFor(key),
        text: String(value),
      });
      continue;
    }
    try {
      out.push({
        key,
        labelKey: labelKeyFor(key),
        text: JSON.stringify(value),
      });
    } catch {
      // skip non-serializable
    }
  }
  return out;
}

function labelKeyFor(key: string): string | undefined {
  if (key === 'mentioned_on') {
    return 'task.custom-field-mentioned-on';
  }
  return undefined;
}

function asLinkItems(value: unknown): CustomFieldLinkItem[] | null {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => asSingleLink(item))
      .filter((item): item is CustomFieldLinkItem => !!item);
    return items.length ? items : null;
  }
  const one = asSingleLink(value);
  return one ? [one] : null;
}

function asSingleLink(value: unknown): CustomFieldLinkItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const obj = value as Record<string, unknown>;
  const url = typeof obj['url'] === 'string' ? obj['url'].trim() : '';
  const titleRaw =
    (typeof obj['title'] === 'string' && obj['title']) ||
    (typeof obj['summary'] === 'string' && obj['summary']) ||
    url;
  const title = String(titleRaw || '').trim();
  if (!url && !title) {
    return null;
  }
  return {
    title: title || url,
    url,
    relationship:
      typeof obj['relationship'] === 'string' ? obj['relationship'] : undefined,
    application:
      typeof obj['application'] === 'string' ? obj['application'] : undefined,
    summary: typeof obj['summary'] === 'string' ? obj['summary'] : undefined,
  };
}
