import { Injectable } from '@angular/core';
import { isBefore, parseJSON } from 'date-fns';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs/operators';
import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';
import {
  Priority,
  Resolution,
  Status,
  Type,
  Workflow,
} from '../settings/dictionary.model';
import { User } from '../user/user.model';
import { RwWebsocketService } from '../websocket/websocket.service';
import { Container } from './container.model';
import { Milestone } from './milestone.model';

@Injectable({
  providedIn: 'root',
})
export class RwContainerService {
  containers = new BehaviorSubject<Container[]>([]);
  containersIDMap = new BehaviorSubject<Map<string, Container>>(
    new Map<string, Container>(),
  );
  containersKeyMap = new BehaviorSubject<Map<string, Container>>(
    new Map<string, Container>(),
  );

  priorityMap = new Map<string, Priority>();
  statusMap = new Map<string, Status>();
  typeMap = new Map<string, Type>();
  resolutionMap = new Map<string, Resolution>();
  workflowsMap = new Map<string, Workflow>();

  constructor(
    private dataService: RwDataService,
    private websocketService: RwWebsocketService,
  ) {
    this.websocketService.container
      .pipe(debounceTime(500))
      .subscribe((event) => {
        if (event.type === 'container_delete') {
          this.removeContainer({ id: event.container } as Container);
        } else {
          this.dataService
            .getContainer(event.container)
            .pipe(tap((c) => this.updateContainers([c])))
            .subscribe();
        }
      });
  }

  init(): Observable<Container[]> {
    return this.dataService.getContainers({ archived: false }).pipe(
      tap((containers: Container[]) => {
        this.updateContainers(containers || []);
        this.updateDictionary();
      }),
    );
  }

  updateContainers(containers: Container[]) {
    // Update ID map
    const idMap = this.containersIDMap.getValue();
    if (containers) {
      for (const c of containers) {
        idMap.set(c.id, c);
      }
    }

    this.updateMaps();
  }

  removeContainer(container: Container) {
    // Update ID map
    const idMap = this.containersIDMap.getValue();
    idMap.delete(container.id);

    this.updateMaps();
  }

  updateMaps() {
    // Update ID map
    const idMap = this.containersIDMap.getValue();

    this.containersIDMap.next(idMap);
    // Update list from id map
    this.containers.next(Array.from(idMap.values()));

    // Update key map from ID map
    const keyMap = new Map<string, Container>();
    for (const c of Array.from(idMap.values())) {
      keyMap.set(c.key, c);
    }
    this.containersKeyMap.next(keyMap);
  }

  saveDictionary<T>(name: string, dict: T[]) {
    return this.dataService
      .saveDictionary(name, dict)
      .pipe(tap(() => this.updateDictionary()));
  }

  updateDictionary(): void {
    this.priorityMap = new Map();
    this.statusMap = new Map();
    this.typeMap = new Map();
    this.resolutionMap = new Map();
    this.workflowsMap = new Map<string, Workflow>();
    this.dataService
      .getDictionary<Priority>('dictionary/priority')
      .subscribe((data) => {
        for (let i = 0; i < data.length; i++) {
          this.priorityMap.set(data[i].id, data[i]);
        }
      });
    this.dataService
      .getDictionary<Status>('dictionary/status')
      .subscribe((data) => {
        for (let i = 0; i < data.length; i++) {
          this.statusMap.set(data[i].id, data[i]);
        }
      });
    this.dataService
      .getDictionary<Type>('dictionary/type')
      .subscribe((data) => {
        for (let i = 0; i < data.length; i++) {
          this.typeMap.set(data[i].id, data[i]);
        }
      });
    this.dataService
      .getDictionary<Resolution>('dictionary/resolution')
      .subscribe((data) => {
        for (let i = 0; i < data.length; i++) {
          this.resolutionMap.set(data[i].id, data[i]);
        }
      });
    this.dataService.getWorkflows().subscribe((workflows) => {
      for (let i = 0; i < workflows.length; i++) {
        this.workflowsMap.set(workflows[i].id, workflows[i]);
      }
    });
  }
  getContainerByKey(key: string): Observable<Container> {
    return this.containersKeyMap.pipe(map((m) => m.get(key)));
  }
  getContainerByID(id: string): Observable<Container> {
    return this.containersIDMap.pipe(map((m) => m.get(id)));
  }
  async getIssueTemplate(containerId: string): Promise<Issue> {
    const container: Container = await firstValueFrom(
      this.getContainerByID(containerId),
    );
    const issueTemplate = {
      viewType: 'newFromContainer',
      estimated_time: container.settings.issue.estimated_time,
      type: container.settings.issue.type,
      priority: container.settings.issue.priority,
      status: container.settings.issue.status,
      auto_scheduling: container.settings.auto_scheduling,
      container: null as Container,
      assignes: null as User[],
    };
    issueTemplate.container = {
      id: container.id,
      title: container.title,
      key: container.key,
      archived: false,
    };
    return issueTemplate;
  }
  getMilestones(
    containerID?: string,
    archived?: boolean,
  ): Observable<Milestone[]> {
    return this.dataService
      .getMilestones(containerID, archived)
      .pipe(map((v) => v.sort((a, b) => b.sort - a.sort)));
  }
  isMilestoneExceededDeadline(milestone: Milestone): boolean {
    return isBefore(parseJSON(milestone.date), parseJSON(milestone.date_calc));
  }
  getDictionaryMap(dictionary: 'status' | 'priority' | 'type' | 'resolution') {
    switch (dictionary) {
      case 'status':
        return this.statusMap;
      case 'priority':
        return this.priorityMap;
      case 'type':
        return this.typeMap;
      case 'resolution':
        return this.resolutionMap;
    }
  }
}
