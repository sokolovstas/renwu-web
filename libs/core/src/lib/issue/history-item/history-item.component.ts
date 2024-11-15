
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  RwDatePipe,
  RwDurationToStringPipe,
  RwTooltipDirective,
} from '@renwu/components';
import * as JsDiff from 'diff';
import { RwSettingsService } from '../../settings/settings.service';
import { RwFormatUserPipe } from '../../user/format-user-pipe/format-user.pipe';
import { IssuePriorityComponent } from '../fields/priority/priority.component';
import { IssueStatusComponent } from '../fields/status/status.component';
import { IssueTypeComponent } from '../fields/type/type.component';
import { IssueHrefComponent } from '../href/issue-href.component';
import {
  FieldChangesLinks,
  IssueChangeEvent,
  IssueLink,
  IssueTodo,
  PulseIssueChangeEvent,
  TimeLogsValue,
} from '../issue.model';

@Component({
  selector: 'renwu-issue-history-item',
  standalone: true,
  imports: [
    RwTooltipDirective,
    IssueHrefComponent,
    IssuePriorityComponent,
    IssueStatusComponent,
    IssueTypeComponent,
    RwFormatUserPipe,
    RwDurationToStringPipe,
    RwDatePipe
],
  templateUrl: './history-item.component.html',
  styleUrl: './history-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueHistoryItemComponent {
  // FIXME
  @Input()
  value: IssueChangeEvent | PulseIssueChangeEvent;

  @Input()
  showSource = true;

  // FIXME: TEMP WORKAROUND to use json and native mongo objects
  @Input()
  idField = 'id';

  @Input()
  showTime = true;

  @Input()
  showAuthor = true;

  constructor(public settingsService: RwSettingsService) {}

  getDescendantProp(obj: Record<string, unknown>, desc: string): unknown {
    const arr = desc.split('.');
    // eslint-disable-next-line no-empty
    while (arr.length && (obj = obj[arr.shift()] as Record<string, unknown>)) {}
    return obj;
  }

  getAdded<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: true,
  ): string[];
  getAdded<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: false,
  ): T[];
  getAdded<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: boolean,
  ): T[] | string {
    const added = new Array<T>();
    if (!changes || !changes.old_value || !changes.new_value) {
      return added;
    }
    for (const value of changes.new_value) {
      // added
      const index = changes.old_value.findIndex(
        (x) =>
          (fieldId
            ? this.getDescendantProp(x as Record<string, unknown>, fieldId)
            : x) ===
          (fieldId
            ? this.getDescendantProp(value as Record<string, unknown>, fieldId)
            : value),
      );
      if (index === -1) {
        added.push(fieldValue ? (value[fieldValue] as T) : value);
      }
    }
    if (join === false) {
      return added;
    } else {
      return added.join(', ');
    }
  }
  getRemoved<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: true,
  ): string[];
  getRemoved<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: false,
  ): T[];
  getRemoved<T>(
    changes: { old_value: T[]; new_value: T[] },
    fieldId?: string,
    fieldValue?: keyof T,
    join?: boolean,
  ): T[] | string {
    const removed = new Array<T>();
    if (!changes || !changes.old_value || !changes.new_value) {
      return removed;
    }
    for (const value of changes.old_value) {
      // removed
      const index = changes.new_value.findIndex(
        (x) =>
          (fieldId
            ? this.getDescendantProp(x as Record<string, unknown>, fieldId)
            : x) ===
          (fieldId
            ? this.getDescendantProp(value as Record<string, unknown>, fieldId)
            : value),
      );
      if (index === -1) {
        removed.push(fieldValue ? (value[fieldValue] as T) : value);
      }
    }
    if (join === false) {
      return removed;
    } else {
      return removed.join(', ');
    }
  }
  getDescriptionDiff(changes: {
    old_value: string;
    new_value: string;
  }): string {
    let diffHtml = '';
    if (
      (!changes.old_value && changes.old_value !== '') ||
      (!changes.new_value && changes.new_value !== '')
    ) {
      return diffHtml;
    }
    const diff = JsDiff.diffWordsWithSpace(
      changes.old_value,
      changes.new_value,
    );
    diff.forEach(function (part) {
      diffHtml += `<span class="${part.added ? 'text-add' : ''}${
        part.removed ? 'text-remove' : ''
      }">${part.value}</span>`;
    });
    return diffHtml;
  }
  getToDoDiff(changes: {
    old_value: IssueTodo[];
    new_value: IssueTodo[];
  }): ToDoDiff {
    const resultDiff: ToDoDiff = {};
    if (!changes.old_value || !changes.new_value) {
      return resultDiff;
    }
    if (changes.old_value.length !== changes.new_value.length) {
      const added = this.getAdded<IssueTodo>(
        changes,
        'description',
        undefined,
        false,
      );
      const removed = this.getRemoved<IssueTodo>(
        changes,
        'description',
        undefined,
        false,
      );
      if (added.length === 1) {
        resultDiff.added = added[0].description;
      }
      if (removed.length === 1) {
        resultDiff.removed = removed[0].description;
      }
    } else {
      for (let i = 0; i < changes.new_value.length; i++) {
        let diffHtml = '';
        const diff = JsDiff.diffWordsWithSpace(
          changes.old_value[i].description,
          changes.new_value[i].description,
        );
        if (diff.length > 1) {
          diff.forEach(function (part) {
            diffHtml += `<span class="${part.added ? 'text-add' : ''}${
              part.removed ? 'text-remove' : ''
            }">${part.value}</span>`;
          });
          resultDiff.text = diffHtml;
        }

        if (changes.old_value[i].is_done !== changes.new_value[i].is_done) {
          if (changes.new_value[i].is_done) {
            resultDiff.done = changes.new_value[i].description;
          }
          if (!changes.new_value[i].is_done) {
            resultDiff.undone = changes.new_value[i].description;
          }
        }
      }
    }
    return resultDiff;
  }
  getTimeLogsDiff(changes: {
    field_name: string;
    old_value: TimeLogsValue[];
    new_value: TimeLogsValue[];
  }): TimeLogsDiff {
    const resultDiff: TimeLogsDiff = {};
    if (!changes.old_value || !changes.new_value) {
      return resultDiff;
    }
    if (changes.old_value.length !== changes.new_value.length) {
      const added = this.getAdded<TimeLogsValue>(
        changes,
        'date_created',
        undefined,
        false,
      );
      const removed = this.getRemoved<TimeLogsValue>(
        changes,
        'date_created',
        undefined,
        false,
      );
      if (added.length === 1) {
        resultDiff.added = added[0];
      }
      if (removed.length === 1) {
        resultDiff.removed = removed[0];
      }
    } else {
      for (let i = 0; i < changes.new_value.length; i++) {
        if (
          changes.old_value[i].value.duration !==
          changes.new_value[i].value.duration
        ) {
          resultDiff.changed = changes.new_value[i];
        }
      }
    }
    return resultDiff;
  }
  private getOneLinkTypeDiff(
    changes: FieldChangesLinks,
    name: 'next_issue' | 'prev_issue' | 'related' | 'parent',
  ): AddedRemoveLinkChanges {
    const resultDiff = {
      added: undefined,
      removed: undefined,
    } as AddedRemoveLinkChanges;

    const c = {
      old_value: (changes.old_value[name] || []) as IssueLink[],
      new_value: (changes.new_value[name] || []) as IssueLink[],
    };
    const added = this.getAdded<IssueLink>(c, '_id', undefined, false);
    const removed = this.getRemoved<IssueLink>(c, '_id', undefined, false);
    if (added.length === 1) {
      resultDiff.added = added[0];
    }
    if (removed.length === 1) {
      resultDiff.removed = removed[0];
    }

    return resultDiff;
  }
  getLinksDiff(changes: FieldChangesLinks): LinksDiff {
    const resultDiff: LinksDiff = {} as LinksDiff;
    if (!changes.old_value || !changes.new_value) {
      return resultDiff;
    }

    // NEXT
    resultDiff.next = this.getOneLinkTypeDiff(changes, 'next_issue');
    resultDiff.prev = this.getOneLinkTypeDiff(changes, 'prev_issue');
    resultDiff.related = this.getOneLinkTypeDiff(changes, 'related');
    resultDiff.parent = this.getOneLinkTypeDiff(changes, 'parent');
    return resultDiff;
  }
  canDisplay(): boolean {
    if (!this.value) {
      return false;
    }
    if (
      this.value.type === 'issue_favorite' ||
      this.value.type === 'issue_unfavorite' ||
      this.value.type === 'issue_create' ||
      this.value.type === 'issue_delete'
    ) {
      return true;
    }
    if (
      (this.value.type === undefined ||
        this.value.type === 'issue_update' ||
        this.value.type === 'issue_timelog' ||
        this.value.type === 'issue_transition') &&
      this.value.fields_changes &&
      this.value.fields_changes.length > 0
    ) {
      return true;
    }
    if (
      (this.value.type === 'issue_update' ||
        this.value.type === 'issue_timelog' ||
        this.value.type === 'issue_transition') &&
      !this.value.fields_changes
    ) {
      return true;
    }
    return false;
  }
}

interface ToDoDiff {
  text?: string;
  done?: string;
  undone?: string;
  added?: string;
  removed?: string;
}
interface TimeLogsDiff {
  changed?: TimeLogsValue;
  added?: TimeLogsValue;
  removed?: TimeLogsValue;
}

export interface AddedRemoveLinkChanges {
  added: { key: string; title: string };
  removed: { key: string; title: string };
}

export interface LinksDiff {
  next: AddedRemoveLinkChanges;
  parent: AddedRemoveLinkChanges;
  prev: AddedRemoveLinkChanges;
  related: AddedRemoveLinkChanges;
}
