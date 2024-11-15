import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AsyncPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { RwIconComponent } from '@renwu/components';
import { AvatarComponent, MessageCounterComponent } from '@renwu/core';
import { MessageDestination } from '../message-destination';

@Component({
  selector: 'renwu-messaging-sub-destinations',
  standalone: true,
  imports: [
    RwIconComponent,
    MessageCounterComponent,
    AvatarComponent,
    NgClass,
    AsyncPipe
],
  templateUrl: './sub-destinations.component.html',
  styleUrl: './sub-destinations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('popupButton', [
      state(
        'void',
        style({
          transform: 'scale(0)',
        }),
      ),
      state(
        'normal',
        style({
          display: 'none',
        }),
      ),
      state(
        'close',
        style({
          opacity: '1',
          transform: 'scale(1)',
        }),
      ),
      state(
        'open',
        style({
          opacity: '1',
          transform: 'scale(1)',
        }),
      ),
      transition('close => open', animate('200ms ease')),
      transition('open => close', animate('200ms ease')),
    ]),
    trigger('iconState', [
      state(
        'close',
        style({
          transform: 'rotate(0deg) translateY(-1px)',
        }),
      ),
      state(
        'open',
        style({
          transform: 'rotate(180deg) translateY(-1px)',
        }),
      ),
      transition('* => *', animate('200ms ease')),
    ]),
    trigger('show', [
      state(
        'void',
        style({
          opacity: '0',
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
export class MessageSubDestinationsComponent {
  destroy = inject(DestroyRef);

  @Input()
  destination: MessageDestination;

  @Input()
  subDestination: MessageDestination;

  @Input()
  state = 'normal';

  @Output()
  opened = new EventEmitter<boolean>();

  @Output()
  selected = new EventEmitter<MessageDestination>();

  onOpen() {
    this.opened.next(true);
  }
  onSelectDestination(destination: MessageDestination) {
    this.opened.next(true);
    this.selected.next(destination);
  }
  onCloseDestination(destination: MessageDestination) {
    this.opened.next(true);
    this.selected.next(destination);
  }
}
