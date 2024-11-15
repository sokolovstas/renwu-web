import { inject, Pipe, PipeTransform } from '@angular/core';
import { User, UserStatic } from '../user.model';
import { RwUserService } from '../user.service';

@Pipe({ name: 'rwFormatUser', standalone: true })
export class RwFormatUserPipe implements PipeTransform {
  userService = inject(RwUserService);
  transform(users: User[] | User, showAutoassign?: boolean) {
    if (Array.isArray(users)) {
      users.map((u) => this.userService.getUser(u.id) || u);
      if (!users || users.length === 0) {
        return '❉ Team';
      }
      if (users[0].username || users[0].full_name) {
        const usersArray: string[] = [];
        for (const user of users) {
          let str = UserStatic.getStringValue(user);
          if (showAutoassign) {
            str = '❉ ' + str;
          }
          usersArray.push(str);
        }
        return usersArray.join(', ');
      }
    } else if (users) {
      users = this.userService.getUser(users.id) || users;
      return UserStatic.getStringValue(users) || '-';
    }
    return '-';
  }
}
