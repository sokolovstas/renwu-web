import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
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
  animations: [
    trigger('transition', [
      state(
        'void',
        style({
          transform: 'scale(0)',
        }),
      ),
      state(
        '*',
        style({
          opacity: '1',
          transform: 'scale(1)',
        }),
      ),
      transition('* => void', animate('200ms ease')),
      transition('void => *', animate('200ms ease')),
    ]),
  ],
})
export class MessageCounterComponent {
  @Input()
  destination: {
    pulseCount?: BehaviorSubject<number>;
    unreadCount?: BehaviorSubject<number>;
  };

  @HostBinding('@transition')
  transition = 'SHOW';

  @Input()
  showOne = false;

  @Input()
  allowMark = false;

  @Output()
  unreadClick = new EventEmitter<void>();

  @Output()
  pulseClick = new EventEmitter<void>();
}
