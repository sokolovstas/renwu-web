
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  Type,
} from '@angular/core';
import { RwDurationToStringPipe, RwTooltipDirective } from '@renwu/components';
import { Issue, IssueChilds } from '../issue/issue.model';
import { ParentProgressTooltipComponent } from './parent-progress-tooltip/parent-progress-tooltip.component';

@Component({
  selector: 'renwu-issue-status-bar',
  standalone: true,
  imports: [
    RwTooltipDirective,
    ParentProgressTooltipComponent,
    RwDurationToStringPipe
],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuesStatusBarComponent {
  @Input()
  set childs(childs: IssueChilds) {
    if (!childs) {
      return;
    }
    this.progress.issueTotal = childs.childs_total;
    this.progress.issueResolved = childs.childs_resolved;
    this.progress.estimatedTotal = childs.childs_estimated_total;
    this.progress.estimatedResolved = childs.childs_completed_total;

    this.calculateCountAndPercents();
    if (childs.childs) {
      this.mapStatuses(childs.childs);
    }
    this.cd.markForCheck();
  }
  @Input()
  set issues(childs: Issue[]) {
    this._issues = childs;
    this.calculateProgress(this._issues);
    this.mapStatuses(this._issues);
  }

  _issues: Issue[] = [];

  @Input()
  set groupBy(value: string[]) {
    this._groupBy = value || [];
    this.calculateProgress(this._issues);
    this.mapStatuses(this._issues);
  }

  _groupBy: string[] = ['status'];

  @Output()
  itemClick = new EventEmitter<GroupItem['value']>();

  progress = {
    issueTotal: 0,
    issueResolved: 0,
    estimatedTotal: 0,
    estimatedResolved: 0,
    estimateRemaining: 0,
    percents: 0,
  };
  statusChilds: GroupItem[];

  tooltipParents: Type<void> = ParentProgressTooltipComponent;

  constructor(private cd: ChangeDetectorRef) {
    this.progress.issueTotal = 0;
    this.progress.issueResolved = 0;
    this.progress.estimatedTotal = 0;
    this.progress.estimatedResolved = 0;
  }

  calculateProgress(issues: Issue[]) {
    this.progress.issueTotal = 0;
    this.progress.issueResolved = 0;
    this.progress.estimatedTotal = 0;
    this.progress.estimatedResolved = 0;

    if (issues) {
      for (let i = 0; i < issues.length; ++i) {
        this.progress.issueTotal++;
        this.progress.estimatedTotal += issues[i].estimated_time;
        if (issues[i].status && issues[i].status.completed) {
          this.progress.issueResolved++;
          this.progress.estimatedResolved += issues[i].estimated_time;
        }
      }
      this.calculateCountAndPercents();
    }
  }

  calculateCountAndPercents() {
    this.progress.estimateRemaining =
      this.progress.estimatedTotal - this.progress.estimatedResolved;
    this.progress.percents = Math.round(
      (this.progress.estimatedResolved / this.progress.estimatedTotal) * 100,
    );
  }

  mapStatuses(issues: Issue[]) {
    const estimatedTotal = this.progress.estimatedTotal;
    this.statusChilds = [];
    const mapStatusChilds: Record<string, GroupItem> = {};
    if (issues) {
      for (let i = 0; i < issues.length; ++i) {
        for (const groupBy of this._groupBy) {
          let groupValue: any = issues[i][groupBy as keyof Issue];
          if (groupValue && Array.isArray(groupValue) && groupValue[0]) {
            groupValue = {
              id: groupValue[0].id,
              label: groupValue[0].title,
              color: groupValue[0].color,
            };
          }
          if (!groupValue) {
            groupValue = { id: null, label: 'Null' };
          }
          if (!mapStatusChilds[groupValue.id]) {
            const statusMapItem: GroupItem = {
              value: groupValue,
              duration: issues[i].estimated_time,
              count: 1,
              progress: (issues[i].estimated_time * 100) / estimatedTotal,
            };
            if (estimatedTotal > 0) {
              statusMapItem.progress =
                (statusMapItem.duration * 100) / estimatedTotal;
            }
            mapStatusChilds[groupValue.id] = statusMapItem;
            this.statusChilds.push(statusMapItem);
          } else {
            mapStatusChilds[groupValue.id].count += 1;
            mapStatusChilds[groupValue.id].duration += issues[i].estimated_time;
            mapStatusChilds[groupValue.id].progress =
              (mapStatusChilds[groupValue.id].duration * 100) / estimatedTotal;
          }
        }
      }
    }
  }
}

interface GroupItem {
  value: { id: string; label: string; color?: string };
  duration: number;
  count: 1;
  progress: number;
}
