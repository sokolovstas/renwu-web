import { Injectable, inject } from '@angular/core';
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
  private dataService = inject(RwDataService);
  private websocketService = inject(RwWebsocketService);

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

  constructor() {
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
    const container = await this.resolveContainer(containerId);
    const issueSettings = container?.settings?.issue || ({} as Issue);
    const defaults = await this.getGlobalIssueDefaults(issueSettings);
    const issueTemplate = {
      ...defaults,
      viewType: 'newFromContainer',
      estimated_time:
        issueSettings.estimated_time || defaults.estimated_time,
      auto_scheduling:
        container?.settings?.auto_scheduling ?? defaults.auto_scheduling,
      assignes: null as User[],
      container: container
        ? {
            id: container.id,
            title: container.title,
            key: container.key,
          }
        : null,
    };
    return issueTemplate as Issue;
  }

  /** Defaults for a new issue when container template fields are empty. */
  async getGlobalIssueDefaults(
    issueSettings: Partial<Issue> = {},
  ): Promise<Pick<Issue, 'type' | 'priority' | 'status' | 'estimated_time' | 'auto_scheduling'>> {
    const [type, priority, status] = await Promise.all([
      this.resolveDictionaryDefault(issueSettings.type, 'type'),
      this.resolveDictionaryDefault(issueSettings.priority, 'priority'),
      this.resolveDictionaryDefault(issueSettings.status, 'status'),
    ]);
    return {
      type,
      priority,
      status,
      estimated_time: issueSettings.estimated_time || 4 * 60 * 60,
      auto_scheduling: true,
    };
  }

  private async resolveContainer(
    containerId: string,
  ): Promise<Container | null> {
    if (!containerId) {
      return null;
    }
    let container = await firstValueFrom(this.getContainerByID(containerId));
    if (!container) {
      try {
        container = await firstValueFrom(
          this.dataService.getContainer(containerId),
        );
        if (container) {
          this.updateContainers([container]);
        }
      } catch {
        return null;
      }
    }
    return container ?? null;
  }

  /**
   * Prefer container template value; otherwise take the global dictionary
   * item marked default (or the first item), matching backend GetDefault.
   */
  private async resolveDictionaryDefault<
    T extends { id: string; default: boolean },
  >(
    value: T | null | undefined,
    dictionary: 'status' | 'priority' | 'type',
  ): Promise<T | null> {
    if (value?.id) {
      return value;
    }
    const map = this.getDictionaryMap(dictionary) as unknown as Map<string, T>;
    let items = Array.from(map.values());
    if (!items.length) {
      items = await firstValueFrom(
        this.dataService.getDictionary<T>(`dictionary/${dictionary}`),
      );
      for (const item of items) {
        map.set(item.id, item);
      }
    }
    return items.find((item) => item.default) || items[0] || null;
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
