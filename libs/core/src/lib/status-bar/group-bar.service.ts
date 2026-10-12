import { Injectable, inject } from '@angular/core';
import { Color } from '@renwu/utils';
import { Issue } from '../issue/issue.model';
import { User } from '../user/user.model';
import { RwUserService } from '../user/user.service';

export interface GroupBarValue {
  id: string | null;
  label: string;
  title?: string;
  color?: string;
}

export interface GroupBarSegment {
  value: GroupBarValue;
  duration: number;
  count: number;
  progress: number;
  textColor: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssueGroupBarService {
  private userService = inject(RwUserService);

  buildSegments(
    issues: Issue[] | null | undefined,
    groupBy: string[],
  ): GroupBarSegment[] {
    if (!issues?.length || !groupBy?.length) {
      return [];
    }

    let estimatedTotal = 0;
    for (const issue of issues) {
      estimatedTotal += issue.estimated_time || 0;
    }

    const segments: GroupBarSegment[] = [];
    const byId: Record<string, GroupBarSegment> = {};

    for (const issue of issues) {
      for (const field of groupBy) {
        let raw: unknown = issue[field as keyof Issue];
        if (field === 'assignes' && isEmptyGroupValue(raw)) {
          raw = issue.assignes_calc;
        }
        const value = normalizeGroupValue(raw, (user) =>
          this.userService.getInitialsColor(user),
        );
        const mapKey = String(value.id);
        const duration = issue.estimated_time || 0;
        if (!byId[mapKey]) {
          const background = value.color || '#777';
          const segment: GroupBarSegment = {
            value,
            duration,
            count: 1,
            progress: 0,
            textColor: contrastTextColor(background),
          };
          byId[mapKey] = segment;
          segments.push(segment);
        } else {
          byId[mapKey].count += 1;
          byId[mapKey].duration += duration;
        }
      }
    }

    const issueCount = issues.length;
    for (const segment of segments) {
      if (estimatedTotal > 0) {
        segment.progress = (segment.duration * 100) / estimatedTotal;
      } else if (issueCount > 0) {
        segment.progress = (segment.count * 100) / issueCount;
      }
    }

    return segments;
  }
}

function isEmptyGroupValue(value: unknown): boolean {
  if (value == null || value === '') {
    return true;
  }
  return Array.isArray(value) && !value[0];
}

function normalizeGroupValue(
  raw: unknown,
  initialsColor?: (user: User) => string,
): GroupBarValue {
  if (isEmptyGroupValue(raw)) {
    return { id: null, label: 'Null' };
  }
  if (Array.isArray(raw)) {
    return normalizeGroupValue(raw[0], initialsColor);
  }
  if (typeof raw === 'string' || typeof raw === 'number') {
    const text = String(raw);
    return { id: text, label: text, title: text };
  }
  if (typeof raw !== 'object') {
    return { id: null, label: 'Null' };
  }

  const obj = raw as {
    id?: string | null;
    label?: string;
    title?: string;
    username?: string;
    full_name?: string;
    color?: string;
    initials_color?: string;
  };
  const display =
    obj.label || obj.title || obj.full_name || obj.username || 'Null';
  const filterValue = obj.username || obj.title || obj.label || display;
  const id = obj.id != null && obj.id !== '' ? String(obj.id) : display;
  let color = obj.color || obj.initials_color;
  if (!color && obj.username && initialsColor) {
    color = initialsColor(obj) || undefined;
  }

  return {
    id,
    label: display,
    title: filterValue,
    color,
  };
}

function contrastTextColor(background: string): string {
  return new Color(background).getTextColor(
    'var(--always-white)',
    'var(--always-black)',
  );
}
