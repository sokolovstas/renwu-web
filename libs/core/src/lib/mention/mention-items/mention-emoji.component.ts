import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { MentionsListItem } from '@renwu/mentions';
import { Emoji } from '../../emoji/emoji.model';

@Component({
  selector: 'renwu-mention-emoji',
  template: `<div class="emoji-{{ item.type }}" [innerHTML]="item.icon"></div>
    <div>
      &nbsp;:{{ item.name }}:<br /><small
        ><i>&nbsp;&nbsp;({{ item.search }})</i></small
      >
    </div>`,
  standalone: true,
  styleUrl: './mention-emoji.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionEmojiComponent implements MentionsListItem<Emoji> {
  @Input()
  item: Emoji;

  @Input()
  @HostBinding('class.active')
  active: boolean;
}
