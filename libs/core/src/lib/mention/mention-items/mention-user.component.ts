import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { MentionsListItem } from '@renwu/mentions';
import { AvatarComponent } from '../../avatar/avatar.component';
import { User } from '../../user/user.model';

@Component({
  selector: 'renwu-mention-user',
  template: `<renwu-avatar [user]="item"></renwu-avatar>
    <div class="fullname">
      <div>{{ item?.full_name || item?.username }}</div>
      @if (item?.full_name) {
        <small>({{ item?.username }})</small>
      }
    </div>`,
  standalone: true,
  imports: [AvatarComponent],
  styleUrl: './mention-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionUserComponent implements MentionsListItem<User> {
  @Input()
  item: User;

  @Input()
  @HostBinding('class.active')
  active: boolean;
}
