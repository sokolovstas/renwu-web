import { Injectable, inject } from '@angular/core';
import { Mentions } from '@renwu/mentions';
import { of } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { RwContainerService } from '../container/container.service';
import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';
import { User, UserStatic } from '../user/user.model';
import { RwUserService } from '../user/user.service';
import { MentionIssueComponent } from './mention-items/mention-issue.component';
import { MentionUserComponent } from './mention-items/mention-user.component';

@Injectable({
  providedIn: 'root',
})
export class RwMentionsProviderService {
  private containerService = inject(RwContainerService);
  private userService = inject(RwUserService);
  private dataService = inject(RwDataService);

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
          .getDictionaryOptions<Issue>(
            'issue/options',
            null,
            {
              /*container: this.containerService.currentContainer,*/ q: search,
            },
            0,
          )
          .pipe(map((v) => v.results));
      },
      mentionSelect: (item: Issue) => `#${item.key}`,
    };
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
