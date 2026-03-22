import { AsyncPipe } from '@angular/common';
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
import { AvatarComponent, MessageCounterComponent } from '@renwu/core';
import { MessageDestination } from '../message-destination';

@Component({
  selector: 'renwu-messaging-sub-destinations',
  standalone: true,
  imports: [
    MessageCounterComponent,
    AvatarComponent,
    AsyncPipe
],
  templateUrl: './sub-destinations.component.html',
  styleUrl: './sub-destinations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
