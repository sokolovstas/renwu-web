import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { MentionsListItem } from '@renwu/mentions';
import { ChatCommand } from '../chat-command.model';

@Component({
  selector: 'renwu-mention-command',
  standalone: true,
  template: `
    <div class="command">{{ item?.command }}</div>
    <div class="meta">
      <div class="label">{{ item?.label }}</div>
      @if (item?.description) {
        <small>{{ item.description }}</small>
      }
    </div>
  `,
  styleUrl: './mention-command.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionCommandComponent implements MentionsListItem<ChatCommand> {
  @Input()
  item: ChatCommand;

  @Input()
  @HostBinding('class.active')
  active: boolean;
}
