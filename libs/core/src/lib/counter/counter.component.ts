import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { RwIconComponent } from '@renwu/components';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'renwu-message-counter',
  standalone: true,
  imports: [RwIconComponent, AsyncPipe],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageCounterComponent {
  @Input()
  destination: {
    pulseCount?: BehaviorSubject<number>;
    unreadCount?: BehaviorSubject<number>;
  };

  /** When true, skip enter/leave animations (e.g. sub-destination row with animations disabled). */
  @Input()
  skipBadgeAnimation = false;

  @Input()
  showOne = false;

  @Input()
  allowMark = false;

  @Output()
  unreadClick = new EventEmitter<void>();

  @Output()
  pulseClick = new EventEmitter<void>();
}
