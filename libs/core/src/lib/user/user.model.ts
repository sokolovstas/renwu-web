import { Issue } from '../issue/issue.model';
import { HolidayCalendar } from '../settings/dictionary.model';
import { UserSettingsServer } from '../settings/settings.model';

export interface CurrentUser {
  user: User;
}
export enum UserType {
  INTERNAL = 'internal',
  DUMMY = 'dummy',
  EXTERNAL = 'external',
}
export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DELETED = 'deleted',
}
export interface User {
  id?: string;
  global_user_id?: string;
  username?: string;
  external_id?: string;
  full_name?: string;
  birthday?: number;
  holidays?: HolidayCalendar;
  email?: string;
  phone?: string;
  work_hours?: { [key: string]: Record<string, never> };
  days_holiday?: string[];
  days_working?: string[];
  status?: UserStatus;
  is_admin?: boolean;
  views?: any[];
  online?: boolean;
  avatar_id?: string;
  initials_text?: string;
  initials_color?: string;
  type?: UserType;
  settings?: UserSettingsServer;
}

export class UserStatic {
  static compareForSearch(
    userA: User,
    userB: User,
    search: string,
  ): 0 | 1 | -1 {
    const weightA = UserStatic.getWeight(userA, search);
    const weightB = UserStatic.getWeight(userB, search);
    if (weightA > weightB) {
      return -1;
    }
    if (weightA < weightB) {
      return 1;
    }
    if (weightA === weightB) {
      if (weightA === 0.6 || weightA === 0.2) {
        if (userA.username.toLowerCase() < userB.username.toLowerCase()) {
          return -1;
        }
        if (userA.username.toLowerCase() > userB.username.toLowerCase()) {
          return 1;
        }
      } else {
        if (userA.full_name.toLowerCase() < userB.full_name.toLowerCase()) {
          return -1;
        }
        if (userA.full_name.toLowerCase() > userB.full_name.toLowerCase()) {
          return 1;
        }
      }
      return 0;
    }
    return 0;
  }

  static getWeight(user: User, search: string) {
    if (
      UserStatic.getShortFullname(user)
        .toLowerCase()
        .indexOf(search.toLowerCase()) === 0
    ) {
      return 1;
    }
    if (
      UserStatic.getShortFullname(user)
        .toLowerCase()
        .indexOf(search.toLowerCase()) > 0
    ) {
      return 0.8;
    }
    if (user.username.toLowerCase().indexOf(search.toLowerCase()) === 0) {
      return 0.6;
    }
    if (user.full_name.toLowerCase().indexOf(search.toLowerCase()) === 0) {
      return 0.4;
    }
    if (user.full_name.toLowerCase().indexOf(search.toLowerCase()) > 0) {
      return 0.2;
    }
    if (user.username.toLowerCase().indexOf(search.toLowerCase()) > 0) {
      return 0;
    }
    return 0;
  }

  static getShortFullname(user: User): string {
    let ret = '';
    if (user.full_name) {
      user.full_name.split(' ').forEach((item: string) => {
        ret += item[0];
      });
    }
    return ret;
  }
  static getSearchString(user: User): string {
    let ret = '';
    if (user.full_name) {
      ret +=
        user.full_name.toLowerCase() +
        ' ' +
        this.getShortFullname(user).toLowerCase();
    }
    if (user.username) {
      if (ret) {
        ret += ' ';
      }
      ret += `${user.username.toLowerCase()}`;
    }
    return ret;
  }
  static getSortValue(user: User): string {
    if (user && user.full_name && user.full_name.trim()) {
      return user.full_name;
    }
    if (user && user.username && user.username.trim()) {
      return user.username;
    }
    return '';
  }

  static getStringValue(user: User): string {
    if (user && user.full_name && user.full_name.trim()) {
      return user.full_name;
    }
    if (user && user.username && user.username.trim()) {
      return user.username;
    }
    return '';
  }

  static filter(user: User, search: string) {
    return this.getSearchString(user).indexOf(search.toLocaleLowerCase()) > -1;
  }

  static filterAndSort(users: User[], search: string) {
    users = users.filter((item) => UserStatic.filter(item, search));
    if (search) {
      users = users.sort((itemA: User, itemB: User) => {
        return UserStatic.compareForSearch(itemA, itemB, search);
      });
    }
    return users;
  }
}

export interface UserD {
  id?: string;
  username?: string;
  full_name?: string;
  avatar_id?: string;
}
export interface UserWorkloadItem {
  month: number;
  quarter: number;
  time_to_now: number;
  total: number;
  value_from_now: number;
  value_to_now: number;
  week: number;
  year: number;
}
export interface UserWorkload {
  workload: {
    months: UserWorkloadItem[];
    quarters: UserWorkloadItem[];
    weeks: UserWorkloadItem[];
  };
}
export interface UserWorkloadIssues {
  issues: Issue[];
}
