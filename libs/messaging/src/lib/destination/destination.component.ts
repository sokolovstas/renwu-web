import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { RwIconComponent, RwTooltipDirective } from '@renwu/components';
import {
  AvatarComponent,
  Issue,
  MessageCounterComponent,
  RwUserService,
  User,
} from '@renwu/core';
import { MessageDestination } from '../message-destination';
import { RwMessageService } from '../message.service';

import { TranslocoPipe } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { DestinationType } from '../data/messages.model';

@Component({
  selector: 'renwu-messaging-destination',
  standalone: true,
  imports: [
    RwIconComponent,
    AvatarComponent,
    MessageCounterComponent,
    RwIconComponent,
    AsyncPipe,
    RwTooltipDirective,
    TranslocoPipe
],
  templateUrl: './destination.component.html',
  styleUrl: './destination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationComponent {
  destroy = inject(DestroyRef);
  update: Subject<boolean> = new Subject<boolean>();
  DestinationType = DestinationType;

  @Input()
  set destination(value: MessageDestination) {
    this._destination = value;
    if (value) {
      value.updateInfo();
    }
    this.update.next(true);
  }
  get destination(): MessageDestination {
    return this._destination;
  }
  _destination: MessageDestination;

  @Input()
  isUser: boolean;

  user: User;
  issue: Issue;

  displayTooltip: boolean;
  widthTooltip: number;
  itemActive: boolean;

  constructor(
    public messageService: RwMessageService,
    public userService: RwUserService,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  markForCheck() {
    this.cd.markForCheck();
  }
  onUnreadClick() {
    this.destination.markreadAllUnread();
  }
  onPulseClick() {
    this.destination.markreadAllPulse();
  }
  openIssue(issue: Issue) {
    this.router.navigate([{ outlets: { section: ['task', issue.id] } }]);
  }
}
