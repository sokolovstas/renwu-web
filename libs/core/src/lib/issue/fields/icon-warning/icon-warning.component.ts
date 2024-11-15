
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwIconComponent, RwTooltipDirective } from '@renwu/components';
import { getUnixTime } from 'date-fns';
import { RwContainerService } from '../../../container/container.service';
import { Issue } from '../../issue.model';

@Component({
  selector: 'renwu-issue-icon-warning',
  standalone: true,
  imports: [RwIconComponent, TranslocoPipe, RwTooltipDirective],
  templateUrl: './icon-warning.component.html',
  styleUrl: './icon-warning.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconWarningComponent {
  @Input()
  set issue(value: Issue) {
    this._issue = value;
    // this.isGroup = value.type === 'group';
    // this.isRoot = value.type === 'root';
    // this.issue.__updateFlags = () => {
    //   this.updateFlags();
    // };
    this.updateFlags();
  }
  get issue(): Issue {
    return this._issue;
  }
  _issue: Issue;

  isRoot: boolean;
  isGroup: boolean;

  flagWarning: boolean;

  flagManual: boolean;
  flagNotPlanning: boolean;
  flagNotPosted: boolean;
  flagCanDrag: boolean;
  flagCanDragManual: boolean;
  flagOffset: boolean;
  flagNoAssignee: boolean;

  constructor(
    private containerService: RwContainerService,
    private cd: ChangeDetectorRef,
  ) {}
  updateFlags() {
    const flagNotPosted =
      !this.issue.date_start && !this.issue.date_start_calc && !this.isGroup;

    // this.flagManual =
    //   !this.issue.auto_scheduling ||
    //   !this.containerService.currentContainer.auto_scheduling;

    this.flagNotPlanning =
      !this.flagManual &&
      flagNotPosted &&
      this.issue.status &&
      !this.issue.status.rebot;
    this.flagNotPosted = this.flagManual && flagNotPosted;
    this.flagCanDrag =
      !this.flagNotPosted &&
      !this.issue.have_childs &&
      !!(this.issue.date_start || this.issue.date_start_calc);
    this.flagCanDragManual = this.flagCanDrag && this.flagManual;
    this.flagOffset =
      !this.issue.auto_scheduling &&
      this.issue.date_start_calc &&
      this.issue.date_start &&
      getUnixTime(new Date(this.issue.date_start_calc)) <
        getUnixTime(new Date(this.issue.date_start));
    this.flagNoAssignee =
      !this.flagManual &&
      (!this.issue.assignes_calc || !this.issue.assignes_calc.length) &&
      (!this.issue.assignes || !this.issue.assignes.length) &&
      !this.issue.have_childs &&
      !this.isGroup;
    this.cd.markForCheck();
  }
}
