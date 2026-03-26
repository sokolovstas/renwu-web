import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { TimelineService as CoreTimelineService } from '@renwu/core';
import {
  IssueBounds,
  IssueTreeRoot,
  IssueViewState,
  TimelineIssue,
} from '../models/timeline-issue.model';
import { TimelineNodeIndexMap, TimelineTreeNode } from '@renwu/core';

@Injectable()
export class TimelineStateService {
  private coreTimelineService = inject(CoreTimelineService);

  private readonly stateMapSignal = signal<Map<string, IssueViewState>>(
    new Map(),
  );

  getViewState(issueId: string): Signal<IssueViewState | undefined> {
    return computed(() => this.stateMapSignal().get(issueId));
  }

  setSelected(issueId: string, selected: boolean): void {
    this.stateMapSignal.update((map) => {
      const next = new Map(map);
      const prev = next.get(issueId);
      next.set(issueId, {
        ...(prev ?? this.createDefaultState()),
        selected,
      });
      return next;
    });
  }

  setBounds(issueId: string, bounds: IssueBounds | null): void {
    this.stateMapSignal.update((map) => {
      const next = new Map(map);
      const prev = next.get(issueId);
      next.set(issueId, {
        ...(prev ?? this.createDefaultState()),
        bounds,
      });
      return next;
    });
  }

  setShowChilds(issueId: string, showChilds: boolean): void {
    this.stateMapSignal.update((map) => {
      const next = new Map(map);
      const prev = next.get(issueId);
      next.set(issueId, {
        ...(prev ?? this.createDefaultState()),
        showChilds,
      });
      return next;
    });
  }

  recalculateIndexes(rootChild: IssueTreeRoot): void {
    const indexMap = this.coreTimelineService.recalculateIndexes(
      rootChild as unknown as TimelineTreeNode,
    );
    this.applyIndexMap(rootChild, indexMap);
  }

  private applyIndexMap(
    rootChild: IssueTreeRoot,
    indexMap: TimelineNodeIndexMap,
  ): void {
    this.stateMapSignal.update((map) => {
      const next = new Map(map);

      const walk = (node: TimelineIssue | IssueTreeRoot): void => {
        const id = node.id ? String(node.id) : undefined;
        if (id) {
          const prev = next.get(id);
          const info = indexMap[id];
          if (info) {
            next.set(id, {
              ...(prev ?? this.createDefaultState()),
              index: info.index,
              countGroupBefore: info.countGroupBefore,
              closed: info.closed,
              showChilds: node._SHOWCHILDS ?? true,
            });
          } else if (!prev) {
            next.set(id, {
              ...this.createDefaultState(),
              showChilds: node._SHOWCHILDS ?? true,
            });
          }
        }

        if (node.childs?.length) {
          for (const c of node.childs) {
            walk(c);
          }
        }
      };

      walk(rootChild);
      return next;
    });
  }

  private createDefaultState(): IssueViewState {
    return {
      selected: false,
      bounds: null,
      showChilds: true,
      closed: false,
      index: 0,
      countGroupBefore: 0,
    };
  }
}

