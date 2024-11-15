/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import {
  Issue,
  ListOptionsFilters,
  RwContainerService,
  UserStatic,
} from '@renwu/core';
import { isAfter, isBefore, isSameDay, isValid } from 'date-fns';

@Pipe({ name: 'renwuSortList', pure: true, standalone: true })
export class SortListPipe<T extends Issue> implements PipeTransform {
  direction = 'up';
  nullPosition = 'down';
  constructor(private containerService: RwContainerService) {}
  getDirectionSort(val: number): number {
    if (this.direction === 'up') {
      return val;
    }
    return val * -1;
  }
  getNullPosition(val: number): number {
    if (this.nullPosition === 'down') {
      return val;
    }
    return val * -1;
  }
  // Padding
  zeroPadding(str: string, count = 10): string {
    const length = count - str.length;
    for (let i = 0; i < length; ++i) {
      str = '0' + str;
    }
    return str;
  }
  zeroPaddingKey(str: string): string {
    if (str) {
      const array = str.split('-');
      if (array[1]) {
        return this.zeroPadding(str.split('-')[1], 10);
      }
    }
    return null;
  }
  // Compare functions
  compareString(a: string, b: string) {
    if (!a && !b) {
      return 0;
    }
    if (!b) {
      return this.getNullPosition(-1);
    }
    if (!a) {
      return this.getNullPosition(1);
    }
    if (a < b) {
      return this.getDirectionSort(-1);
    }
    if (a > b) {
      return this.getDirectionSort(1);
    }
    return 0;
  }
  compareDates(a: Date, b: Date) {
    if (!isValid(a) && !isValid(b)) {
      return 0;
    }
    if (!isValid(b)) {
      return this.getNullPosition(-1);
    }
    if (!isValid(a)) {
      return this.getNullPosition(1);
    }

    if (isBefore(a, b)) {
      return this.getDirectionSort(-1);
    }
    if (isAfter(a, b)) {
      return this.getDirectionSort(1);
    }
    if (isSameDay(a, b)) {
      return 0;
    }
    return 0;
  }
  compareNumber(a: number, b: number) {
    if (a === null) {
      a = undefined;
    }
    if (b === null) {
      b = undefined;
    }
    if (a === undefined && b === undefined) {
      return 0;
    }
    if (b === undefined) {
      return this.getNullPosition(-1);
    }
    if (a === undefined) {
      return this.getNullPosition(1);
    }
    if (a < b) {
      return this.getDirectionSort(-1);
    }
    if (a > b) {
      return this.getDirectionSort(1);
    }
    return 0;
  }
  // Keys
  compareKeys(issueA: T, issueB: T) {
    const keyA = this.zeroPaddingKey(issueA.key);
    const keyB = this.zeroPaddingKey(issueB.key);
    return this.compareString(keyA, keyB);
  }
  // Custom field
  compareTwoFieldString(issueA: T, issueB: T, fieldName: keyof T) {
    return this.compareString(
      issueA[fieldName].toString(),
      issueB[fieldName].toString(),
    );
  }
  compareTwoFieldNumber(issueA: T, issueB: T, fieldName: keyof T) {
    return this.compareNumber(
      Number(issueA[fieldName]),
      Number(issueB[fieldName]),
    );
  }
  // Date
  compareDate(issueA: T, issueB: T, fieldName: keyof T) {
    const dateA = new Date((issueA[fieldName] as string) || 'invalid');
    const dateB = new Date((issueB[fieldName] as string) || 'invalid');
    return this.compareDates(dateA, dateB);
  }
  // Dictionary

  compareDictionary(
    dictionary: 'status' | 'priority' | 'type' | 'resolution',
    issueA: T,
    issueB: T,
  ) {
    let valueA;
    let valueB;
    const dictionaryValues = this.containerService.getDictionaryMap(dictionary);
    if (
      issueA[dictionary] &&
      dictionaryValues &&
      dictionaryValues.get(issueA[dictionary].id)
    ) {
      valueA = dictionaryValues.get(issueA[dictionary].id).sort;
    }
    if (
      issueB[dictionary] &&
      dictionaryValues &&
      dictionaryValues.get(issueB[dictionary].id)
    ) {
      valueB = dictionaryValues.get(issueB[dictionary].id).sort;
    }
    return this.compareNumber(valueA, valueB);
  }
  // Sort filed
  compareMilestoneSort(issueA: T, issueB: T) {
    const milestoneA = this.getIssueMilestoneSort(issueA);
    const milestoneB = this.getIssueMilestoneSort(issueB);
    return this.compareNumber(milestoneA, milestoneB);
  }
  // Assignee
  compareAssignes(issueA: T, issueB: T) {
    const nameA = this.getIssueAssigneeName(issueA);
    const nameB = this.getIssueAssigneeName(issueB);
    return this.compareString(nameA, nameB);
  }
  getIssueAssigneeName(issue: T) {
    if (issue.assignes && issue.assignes[0]) {
      return UserStatic.getSortValue(issue.assignes[0]);
    }
    if (issue.assignes_calc && issue.assignes_calc[0]) {
      return UserStatic.getSortValue(issue.assignes_calc[0]);
    }
    return '';
  }
  // Reporter
  compareReporter(issueA: T, issueB: T) {
    const nameA = UserStatic.getSortValue(issueA.reporter);
    const nameB = UserStatic.getSortValue(issueB.reporter);
    return this.compareString(nameA, nameB);
  }
  // Milestones
  compareMilestones(issueA: T, issueB: T) {
    const milestoneA = this.getIssueMilestone(issueA);
    const milestoneB = this.getIssueMilestone(issueB);
    return this.compareString(milestoneA, milestoneB);
  }
  getIssueMilestone(issue: T) {
    let milestone = '';
    if (issue.parent_milestones && issue.parent_milestones.length > 0) {
      milestone += issue.parent_milestones
        .map((m) => (m.title ? m.title.toLowerCase() : ''))
        .join(',');
    }
    if (issue.milestones && issue.milestones[0] && issue.milestones[0].title) {
      milestone += issue.milestones
        .map((m) => (m.title ? m.title.toLowerCase() : ''))
        .join(',');
    }
    return milestone;
  }
  getIssueMilestoneSort(issue: T) {
    if (
      issue.milestones &&
      issue.milestones[0] &&
      issue.milestones[0].sort !== undefined
    ) {
      return issue.milestones[0].sort;
    }
    if (
      issue.parent_milestones &&
      issue.parent_milestones[0] &&
      issue.parent_milestones[0].sort !== undefined
    ) {
      return issue.parent_milestones[0].sort;
    }
    return undefined;
  }
  // Affected version
  compareAffectedVersion(issueA: T, issueB: T) {
    const affected_versionA = this.getIssueAffectedVersion(issueA);
    const affected_versionB = this.getIssueAffectedVersion(issueB);
    return this.compareString(affected_versionA, affected_versionB);
  }
  getIssueAffectedVersion(issue: T) {
    if (issue.affected_versions && issue.affected_versions.length > 0) {
      return issue.affected_versions
        .map((v) => (v.title ? v.title.toLowerCase() : ''))
        .join(',');
    }
    return '';
  }
  transform(
    array: T[],
    listOptions: ListOptionsFilters,
    nullPosition = 'down',
    issueField = '',
  ): T[] {
    let result = new Array<T>();
    this.direction = listOptions.sort.direction;
    this.nullPosition = nullPosition;
    // Remove null items if exist
    let getIssue = (i: T): T => i || ({} as T);

    if (issueField) {
      getIssue = (i: T): T => ((i as any)[issueField] || {}) as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let filter = (i: T): boolean => true;

    if (
      listOptions &&
      listOptions.textFilter &&
      (listOptions.textFilter.title || listOptions.textFilter.key)
    ) {
      filter = (i: T): boolean => {
        i = getIssue(i);
        if (
          listOptions.textFilter.title &&
          i.title
            .toLowerCase()
            .indexOf(listOptions.textFilter.title.toLowerCase()) > -1
        ) {
          return true;
        }
        if (
          listOptions.textFilter.key &&
          i.key
            .toLowerCase()
            .indexOf(listOptions.textFilter.key.toLowerCase()) > -1
        ) {
          return true;
        }
        return false;
      };
    }
    if (array) {
      result = result.concat(array);
      result = result.filter((item) => !!item);
      switch (listOptions.sort.field) {
        case 'key':
          result
            .sort((a: any, b: any) =>
              this.compareKeys(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'assignes':
          result
            .sort((a: any, b: any) =>
              this.compareAssignes(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'reporter':
          result
            .sort((a: any, b: any) =>
              this.compareReporter(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'milestones':
          result
            .sort((a: any, b: any) =>
              this.compareMilestones(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'milestones.sort':
          result
            .sort((a: any, b: any) =>
              this.compareMilestoneSort(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'affected_versions':
          result
            .sort((a: any, b: any) =>
              this.compareAffectedVersion(getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'title':
          result
            .sort((a: any, b: any) =>
              this.compareTwoFieldString(getIssue(a), getIssue(b), 'title'),
            )
            .filter(filter);
          break;
        case 'completion':
          result
            .sort((a: any, b: any) =>
              this.compareTwoFieldNumber(
                getIssue(a),
                getIssue(b),
                'completion',
              ),
            )
            .filter(filter);
          break;
        case 'skill':
          result
            .sort((a: any, b: any) =>
              this.compareTwoFieldString(getIssue(a), getIssue(b), 'skill'),
            )
            .filter(filter);
          break;
        case 'date_created':
          result
            .sort((a: any, b: any) =>
              this.compareDate(getIssue(a), getIssue(b), 'date_created'),
            )
            .filter(filter);
          break;
        case 'date_status_changed':
          result
            .sort((a: any, b: any) =>
              this.compareDate(getIssue(a), getIssue(b), 'date_status_changed'),
            )
            .filter(filter);
          break;
        case 'date_last_update':
          result
            .sort((a: any, b: any) =>
              this.compareDate(getIssue(a), getIssue(b), 'date_last_update'),
            )
            .filter(filter);
          break;
        case 'date_start':
          result
            .sort((a: any, b: any) =>
              this.compareDate(getIssue(a), getIssue(b), 'date_start'),
            )
            .filter(filter);
          break;
        case 'date_start_calc':
          result
            .sort((a: any, b: any) =>
              this.compareDate(getIssue(a), getIssue(b), 'date_start_calc'),
            )
            .filter(filter);
          break;
        // case '__timelog-date-created':
        //   result
        //     .sort((a: any, b: any) =>
        //       this.compareDate(
        //         getIssue(a),
        //         getIssue(b),
        //         '__timelog-date-created'
        //       )
        //     )
        //     .filter(filter);
        //   break;
        case 'priority':
          result
            .sort((a: any, b: any) =>
              this.compareDictionary('priority', getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'type':
          result
            .sort((a: any, b: any) =>
              this.compareDictionary('type', getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'resolution':
          result
            .sort((a: any, b: any) =>
              this.compareDictionary('resolution', getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
        case 'status':
          result
            .sort((a: any, b: any) =>
              this.compareDictionary('status', getIssue(a), getIssue(b)),
            )
            .filter(filter);
          break;
      }
    }
    return result.filter(filter);
  }
}
