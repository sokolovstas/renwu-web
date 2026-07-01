import { Injectable, inject } from '@angular/core';
import {
  BoardBucketsResponse,
  Issue,
  Milestone,
  Priority,
  RwContainerService,
  RwDataService,
  Status,
  Type,
} from '@renwu/core';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import durationFns from 'duration-fns';
import {
  BoardGroup,
  BoardGroupConfig,
  BoardGroupsConfig,
  BoardSettings,
  BoardStatusColumnConfig,
  DictKeys,
  GroupedIssues,
} from '../board.model';

@Injectable()
export class RwGroupService {
  private containerService = inject(RwContainerService);
  private dataService = inject(RwDataService);

  dictionaries: Map<
    DictKeys,
    (Status | Priority | Type | Milestone | string)[]
  >;
  groupMap = new Map<string, BoardGroup>();
  loadDictionaries(
    containerId: string,
  ): Observable<[Milestone[], string[], string[]]> {
    this.dictionaries = new Map<
      DictKeys,
      (Status | Priority | Type | Milestone)[]
    >();
    this.dictionaries.set(
      'statuses',
      Array.from(this.containerService.statusMap.values()),
    );
    this.dictionaries.set(
      'priorities',
      Array.from(this.containerService.priorityMap.values()),
    );
    this.dictionaries.set(
      'types',
      Array.from(this.containerService.typeMap.values()),
    );
    this.dictionaries.set(
      'resolutions',
      Array.from(this.containerService.resolutionMap.values()),
    );
    // if (this.containerService.currentContainer.team) {
    //   this.dictionaries.set(
    //     'users',
    //     this.containerService.currentContainer.team.map((team) => team.user)
    //   );
    // }

    return forkJoin([
      this.containerService.getMilestones(containerId, false),
      this.dataService.getDictionaryOptions<string>(
        `container/:id/team_skills`,
        containerId,
      ),
      this.dataService.getDictionaryOptions<string>(
        `container/:id/labels`,
        containerId,
      ),
    ]).pipe(
      map(([milestones, skills, labels]) => {
        return [milestones || [], skills.results || [], labels || []] as [
          Milestone[],
          string[],
          string[],
        ];
      }),
      tap(([milestones, skills, labels]) => {
        milestones = milestones || [];
        this.dictionaries.set('milestones', [
          { id: 'null', title: 'Unplanned', sort: -1 } as Milestone,
          ...milestones,
        ]);
        this.dictionaries.set('skills', skills);
        this.dictionaries.set('labels', labels);
      }),
    );
  }
  public group(
    issues: Issue[],
    config: BoardGroupsConfig,
    buckets?: BoardBucketsResponse,
  ): Observable<BoardGroup> {
    if (config.hideParents) {
      issues = issues.filter((issue) => !issue.have_childs);
    }
    this.groupMap = new Map<string, BoardGroup>();
    const reduce = {
      count: 0,
      timeLogged: 0,
      timePlanned: 0,
      timeRemaining: 0,
    };
    const rootGroup = {
      uid: 'root',
      id: 'root',
      ids: new Set<string>(),
      items: issues || [],
      label: 'root',
      issue: {},
      sort: {},
      reduce,
    };
    const root = this.createGroup(rootGroup, null, config.groups, 0, buckets);
    return root;
  }

  private createGroup(
    groupInitial: GroupedIssues,
    parent: BoardGroup,
    configs: BoardGroupConfig[],
    depth: number,
    buckets?: BoardBucketsResponse,
  ): Observable<BoardGroup> {
    return new Observable((observer) => {
      // Run this in worker
      const group = new BoardGroup(configs[depth]);
      group.reduce = groupInitial.reduce;
      group.label = groupInitial.label;
      group.items = groupInitial.items;
      group.sort = groupInitial.sort;
      group.collapsed = groupInitial.collapsed;
      group.wipLimit = groupInitial.wipLimit;
      group.parent = parent;

      if (parent) {
        group.uid = parent.uid + '-' + groupInitial.uid;
        group.id = groupInitial.uid;
        if (groupInitial.issue) {
          group.issue = Object.assign({}, parent.issue, groupInitial.issue);
        }
      } else {
        group.uid = groupInitial.uid;
        group.id = groupInitial.uid;
        if (groupInitial.issue) {
          group.issue = Object.assign({}, groupInitial.issue);
        }
      }

      this.groupMap.set(group.uid, group);

      if (!configs[depth]) {
        group.items = groupInitial.items;
        observer.next(group);
        observer.complete();
        return;
      }
      let initial = {};
      const groupField =
        BoardSettings.groupFields.find(
          (field) => field.id === group.config.field.id,
        ) || BoardSettings.groupFields[0];
      const groupFunction =
        group.config.field.id === 'status-buckets' &&
        group.config.statusColumns?.length
          ? this.createStatusColumnsGroupFunction(
              group.config.statusColumns,
              buckets,
            )
          : groupField.group;
      const initFunction = groupField.init;

      if (group.config.field.id === 'status-buckets' && group.config.showEmpty) {
        initial = this.createStatusColumnsInitial(group.config.statusColumns);
      } else if (initFunction && group.config.showEmpty) {
        initial = initFunction(this.dictionaries).reduce(
          groupFunction,
          initial,
        );
      }

      const groups: {
        [key: string]: GroupedIssues;
      } = groupInitial.items.reduce(groupFunction, initial);
      // const worker = new GroupWorker();
      // worker.postMessage({items: issues, group: group.config.field.id});
      // worker.onmessage = (event: MessageEvent) => {
      const groupsObservables = new Array<Observable<BoardGroup>>();
      const grouped: { [key: string]: GroupedIssues } = groups;
      Object.values(grouped).forEach((g) =>
        groupsObservables.push(
          this.createGroup(g, group, configs, depth + 1, buckets),
        ),
      );
      if (groupsObservables.length === 0) {
        observer.next(group);
        observer.complete();
        return;
      }
      forkJoin(groupsObservables).subscribe((results) => {
        group.groups = results;
        observer.next(group);
        observer.complete();
        return;
      });
    });
  }

  private createStatusColumnsInitial(
    columns: BoardStatusColumnConfig[],
  ): Record<string, GroupedIssues> {
    return (columns || []).reduce<Record<string, GroupedIssues>>(
      (acc, column, index) => {
        acc[column.id] = this.createStatusColumnGroup(column, index);
        return acc;
      },
      {},
    );
  }

  private createStatusColumnsGroupFunction(
    columns: BoardStatusColumnConfig[],
    buckets?: BoardBucketsResponse,
  ): (
    acc: Record<string, GroupedIssues>,
    issue: Issue,
  ) => Record<string, GroupedIssues> {
    const statuses = new Map(
      ((this.dictionaries?.get('statuses') ?? []) as Status[]).map((status) => [
        status.id,
        status,
      ]),
    );
    const columnsById = new Map(columns.map((column) => [column.id, column]));
    const columnIdByIssueId = new Map<string, string>();
    for (const column of buckets?.columns ?? []) {
      for (const issueId of column.issue_ids ?? column.issueIds ?? []) {
        if (!columnIdByIssueId.has(issueId)) {
          columnIdByIssueId.set(issueId, column.id);
        }
      }
    }

    return (acc, issue) => {
      const columnId = issue.id ? columnIdByIssueId.get(issue.id) : undefined;
      let column = columnId ? columnsById.get(columnId) : undefined;
      if (!column) {
        column = this.createOtherStatusColumn();
      }
      if (!acc[column.id]) {
        acc[column.id] = this.createStatusColumnGroup(column, columns.length);
      }
      const targetStatusId = column.targetStatus;
      const targetStatus = targetStatusId ? statuses.get(targetStatusId) : undefined;
      const item = acc[column.id];
      item.items.push(issue);
      item.ids.add(issue.id);
      item.issue = targetStatus ? { status: targetStatus } : {};
      item.sort = { status: targetStatus ?? issue.status };
      item.reduce.count += 1;
      if (issue.estimated_time) {
        const estimated = durationFns.toSeconds({
          seconds: issue.estimated_time,
        });
        item.reduce.timePlanned += estimated;
        item.reduce.timeRemaining += ((100 - issue.completion) * estimated) / 100;
      }
      if (issue.time_logs && Array.isArray(issue.time_logs)) {
        for (const timeLog of issue.time_logs) {
          item.reduce.timeLogged += durationFns.toSeconds({
            seconds: timeLog.value,
          });
        }
      }
      return acc;
    };
  }

  private createStatusColumnGroup(
    column: BoardStatusColumnConfig,
    sortIndex: number,
  ): GroupedIssues {
    const targetStatus = ((this.dictionaries?.get('statuses') ?? []) as Status[]).find(
      (status) => status.id === column.targetStatus,
    );
    return {
      uid: column.id,
      ids: new Set<string>(),
      items: [],
      label: column.title,
      issue: targetStatus ? { status: targetStatus } : {},
      sort: { sort: sortIndex },
      collapsed: column.collapsed,
      wipLimit: column.wipLimit,
      reduce: {
        count: 0,
        timeLogged: 0,
        timePlanned: 0,
        timeRemaining: 0,
      },
    } as GroupedIssues;
  }

  private createOtherStatusColumn(): BoardStatusColumnConfig {
    const column = new BoardStatusColumnConfig('Other');
    column.id = '__other';
    column.targetStatus = '';
    return column;
  }
}
