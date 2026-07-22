import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  DestinationType,
  MessageInputComponent,
  MessageThreadComponent,
  RwMessageService,
} from '@renwu/messaging';
import { filter, map, of, shareReplay, switchMap } from 'rxjs';
import { UserService } from '../../user.service';

@Component({
  selector: 'renwu-profile-view-chat',
  standalone: true,
  imports: [AsyncPipe, MessageThreadComponent, MessageInputComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewChatComponent {
  private readonly profileUserService = inject(UserService);
  private readonly messageService = inject(RwMessageService);

  readonly thread = this.profileUserService.currentUser.pipe(
    map((u) => u?.id),
    filter((id): id is string => !!id),
    switchMap((id) =>
      this.messageService.getDestination(id, DestinationType.USER),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
