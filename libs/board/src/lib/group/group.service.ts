import { Injectable } from '@angular/core';
import {
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
import {
  BoardGroup,
  BoardGroupConfig,
  BoardGroupsConfig,
  BoardSettings,
  DictKeys,
  GroupedIssues,
} from '../board.model';

@Injectable()
export class RwGroupService {
  dictionaries: Map<
    DictKeys,
    (Status | Priority | Type | Milestone | string)[]
  >;
  groupMap = new Map<string, BoardGroup>();

  constructor(
    private containerService: RwContainerService,
    private dataService: RwDataService,
  ) {}
  loadDictionaries(
    containerId: string,
  ): Observable<[Milestone[], string[], string[]]> {
    this.dictionaries = new Map<
      DictKeys,
      (Status | Priority | Type | Milestone)[]
    >();
    this.dictionaries.set(
      'statuses',
      Object.keys(this.containerService.statusMap).map((i) =>
        this.containerService.statusMap.get(i),
      ),
    );
    this.dictionaries.set(
      'priorities',
      Object.keys(this.containerService.priorityMap).map((i) =>
        this.containerService.priorityMap.get(i),
      ),
    );
    this.dictionaries.set(
      'types',
      Object.keys(this.containerService.typeMap).map((i) =>
        this.containerService.typeMap.get(i),
      ),
    );
    this.dictionaries.set(
      'resolutions',
      Object.keys(this.containerService.resolutionMap).map((i) =>
        this.containerService.resolutionMap.get(i),
      ),
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
    const root = this.createGroup(rootGroup, null, config.groups, 0);
    return root;
  }

  private createGroup(
    groupInitial: GroupedIssues,
    parent: BoardGroup,
    configs: BoardGroupConfig[],
    depth: number,
  ): Observable<BoardGroup> {
    return new Observable((observer) => {
      // Run this in worker
      const group = new BoardGroup(configs[depth]);
      group.reduce = groupInitial.reduce;
      group.label = groupInitial.label;
      group.items = groupInitial.items;
      group.sort = groupInitial.sort;
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
      const groupFunction = groupField.group;
      const initFunction = groupField.init;

      if (initFunction && group.config.showEmpty) {
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
        groupsObservables.push(this.createGroup(g, group, configs, depth + 1)),
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
}
