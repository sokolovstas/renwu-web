import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Mentions } from '@renwu/mentions';
import { of } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';
import { User, UserStatic } from '../user/user.model';
import { RwUserService } from '../user/user.service';
import { ChatCommand } from './chat-command.model';
import { MentionCommandComponent } from './mention-items/mention-command.component';
import { MentionIssueComponent } from './mention-items/mention-issue.component';
import { MentionUserComponent } from './mention-items/mention-user.component';

@Injectable({
  providedIn: 'root',
})
export class RwMentionsProviderService {
  private userService = inject(RwUserService);
  private dataService = inject(RwDataService);
  private transloco = inject(TranslocoService);

  // emojies = new Array<Emoji>();
  visible: boolean;
  getUser(): Mentions<User> {
    return {
      triggerChars: ['@'],
      // showSearchListAtChar: 0,
      searchListProps: {
        labelKey: 'username',
      },
      itemComponent: MentionUserComponent,
      getItems: (search) => {
        // return (search: string) => {
        return of(search).pipe(
          withLatestFrom(this.userService.userList),
          map(([search, users]) => UserStatic.filterAndSort(users, search)),
        );
        // }
      },
      mentionSelect: (item: User) => `@${item.username}`,
    };
  }
  getIssue(): Mentions<Issue> {
    return {
      triggerChars: ['#', '№'],
      // showSearchListAtChar: 0,
      searchListProps: {
        labelKey: 'key',
      },
      itemComponent: MentionIssueComponent,
      getItems: (search) => {
        return this.dataService
          .getDictionaryOptions<Issue>('issue/options', '', {
            q: (search ?? '').trim(),
          }, 0)
          .pipe(map((v) => v.results ?? []));
      },
      mentionSelect: (item: Issue) => `#${item.key}`,
    };
  }

  /** Slash commands for issue chat (`/refresh`, …). */
  getCommands(): Mentions<ChatCommand> {
    return {
      triggerChars: ['/'],
      searchListProps: {
        labelKey: 'command',
      },
      itemComponent: MentionCommandComponent,
      getItems: (search) => {
        const q = (search ?? '').trim().toLowerCase().replace(/^\//, '');
        const commands = this.chatCommands();
        return of(
          q
            ? commands.filter(
                (c) =>
                  c.id.includes(q) ||
                  c.command.toLowerCase().includes(q) ||
                  c.label.toLowerCase().includes(q),
              )
            : commands,
        );
      },
      mentionSelect: (item: ChatCommand) => item.command,
    };
  }

  private chatCommands(): ChatCommand[] {
    return [
      {
        id: 'refresh',
        command: '/refresh',
        label: this.t(
          'messaging.command-refresh',
          'Refresh AI session',
        ),
        description: this.t(
          'messaging.command-refresh-hint',
          'Check that the session is alive and extend the wait for a reply',
        ),
      },
    ];
  }

  private t(key: string, fallback: string): string {
    const value = this.transloco.translate(key);
    return !value || value === key ? fallback : value;
  }

  // getEmoji(): Mentions<Emoji> {
  //   return {
  //     triggerChars: [':'],
  //     mentionSelect: (item: Emoji) => `${item.code}`,
  //     searchListProps: {
  //       labelKey: 'icon',
  //     },
  //     itemComponent: MentionEmojiComponent,
  //     getItems: (search) => {
  //       return of(
  //         this.emojies
  //           .filter((emoji) =>
  //             search ? emoji.search.indexOf(search) > -1 : emoji,
  //           )
  //           .slice(0, 20),
  //       );
  //     },
  //     // showSearchListAtChar: 2,
  //   };
  // }
}
