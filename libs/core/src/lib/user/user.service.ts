import { Inject, Injectable } from '@angular/core';
import { switchTap } from '@renwu/utils';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ResponseOk } from '../data/common.model';
import { RwDataService } from '../data/data.service';
import { IssueTodo } from '../issue/issue.model';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';
import { UserSettingsServer } from '../settings/settings.model';
import { User, UserType } from '../user/user.model';
import { RwWebsocketService } from '../websocket/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class RwUserService {
  tenant = '';
  currentUser = new BehaviorSubject<User>(null);
  currentUserValue: User = null;
  userMap = new Map<string, User>();
  onlineMap = new BehaviorSubject<Map<string, boolean>>(new Map());
  userMapByUsername = new Map<string, User>();
  userList = new BehaviorSubject<User[]>([]);
  todos = new BehaviorSubject<IssueTodo[]>([]);
  avatarsMap = new Map<string, string>();
  opened: boolean;
  constructor(
    private dataService: RwDataService,
    private websocketService: RwWebsocketService,
    @Inject(RW_CORE_SETTINGS) private settings: RwCoreSettings,
  ) {
    this.websocketService.user.subscribe((event) => {
      if (event.type !== 'user_settings_update') {
        this.getUsers();
      }
    });
    this.websocketService.connections.subscribe((connections) => {
      const online = new Map<string, boolean>();
      if (connections) {
        for (const connection of connections) {
          online.set(connection.user, true);
        }
        this.onlineMap.next(online);
      }
    });
  }
  init(): Observable<any> {
    return forkJoin([
      this.dataService.getUsers({
        type: [UserType.INTERNAL, UserType.DUMMY, UserType.EXTERNAL],
        showDeleted: true,
      }),
      this.dataService.getCurrentUser(),
    ]).pipe(
      tap(([users, current]) => {
        this.currentUser.next(current.user);
        this.currentUserValue = current.user;
        this.updatePersonalTodos();
        this.updateList(users);

        try {
          // FIXME
          // window.Tawk_API.visitor = {
          //   name: this.currentUser.full_name,
          //   email: this.currentUser.email,
          // };
          // window.dataLayer.push({ event: 'UserLoaded' });
        } catch (e) {
          console.error('No TAWK');
        }
        // FIXME
        // Sentry.configureScope((scope) => {
        //   scope.setUser({
        //     id: this.currentUser.id,
        //     email: this.currentUser.email,
        //     type: this.currentUser.type,
        //     full_name: this.currentUser.full_name,
        //     is_admin: this.currentUser.is_admin,
        //     username: this.currentUser.username,
        //     status: this.currentUser.status,
        //   });
        // });
      }),
    );
  }
  getUsers(): void {
    this.dataService
      .getUsers({
        type: [UserType.INTERNAL, UserType.EXTERNAL, UserType.DUMMY],
        showDeleted: true,
      })
      .subscribe((data) => {
        this.updateList(data);
      });
  }
  getUserById(id: string): User {
    return this.userMap.get(id);
  }
  getUser(id?: string): User | null {
    if (!id && this.currentUserValue) {
      return this.currentUserValue;
    }
    if (id && this.userMap.has(id)) {
      return this.userMap.get(id);
    }
    return null;
  }
  updateList(rows: User[]): void {
    if (!rows) {
      this.userList.next([]);
      this.userMap.clear();
      return;
    }
    for (let i = 0; i < rows.length; ++i) {
      this.setUser(rows[i].id, rows[i]);
    }
    this.userList.next(rows);
  }
  saveUser(id: string, user: User): Observable<User> {
    return this.dataService.saveUser(id, user).pipe(
      tap((updated) => {
        this.setUser(id, updated);
      }),
    );
  }
  saveUserSettings(
    id: string,
    settings: UserSettingsServer,
  ): Observable<UserSettingsServer> {
    return this.dataService.saveUserSettings(id || this.getId(), settings);
  }
  getUserSettings(id?: string): Observable<UserSettingsServer> {
    return this.dataService.getUserSettings(id || this.getId());
  }
  updateUser(id: string): Observable<User> {
    if (!id || id === this.currentUserValue.id) {
      return this.dataService.getCurrentUser().pipe(
        tap((result) => {
          this.currentUser.next(result.user);
          this.currentUserValue = result.user;
          this.setUser(this.currentUserValue.id, this.currentUserValue);
        }),
        map((result) => result.user),
      );
    } else {
      return this.dataService.getUser(id).pipe(
        tap((result: User) => {
          this.setUser(id, result);
        }),
      );
    }
  }
  setUser(id: string, user: User): void {
    this.userMap.set(id, user);
    if (user.username) {
      this.userMapByUsername.set(user.username, user);
    }
    if (user.avatar_id) {
      this.avatarsMap.set(
        id,
        `${this.settings.publicApiUrl}/user/${user.id}/avatar/${user.avatar_id}/`,
      );
    } else {
      this.avatarsMap.set(id, undefined);
    }
    this.userList.next(Array.from(this.userMap.values()));
    if (this.currentUserValue && id === this.currentUserValue.id) {
      this.currentUser.next(this.userMap.get(this.currentUserValue.id));
      this.currentUserValue = this.userMap.get(this.currentUserValue.id);
    }
  }
  deleteUser(id: string): Observable<ResponseOk> {
    return this.dataService.deleteUser(id).pipe(
      tap(() => {
        this.userMapByUsername.delete(this.getUsername({ id }));
        this.userMap.delete(id);
      }),
    );
  }
  restoreUser(id: string): Observable<ResponseOk> {
    return this.dataService
      .restoreUser(id)
      .pipe(switchTap(() => this.updateUser(id)));
  }
  getId(user?: User): string {
    return user?.id || this.getUser(user?.id)?.id || '';
  }
  getInitials(user?: User): string {
    return user?.initials_text || this.getUser(user?.id)?.initials_text || '';
  }

  getInitialsColor(user?: User): string {
    return user?.initials_color || this.getUser(user?.id)?.initials_color || '';
  }
  getAvatar(id?: string): string {
    return this.avatarsMap.get(this.getUser(id)?.id) || '';
  }
  deleteAvatar(id?: string): Observable<User> {
    if (!id) {
      this.avatarsMap.delete(id);
      this.currentUserValue.avatar_id = null;
      return this.saveUser(this.currentUserValue.id, this.currentUserValue);
    }
    this.avatarsMap.delete(id);
    this.getUserById(id).avatar_id = null;
    return this.saveUser(id, this.getUserById(id));
  }
  getDisplayName(user?: User): string {
    return (
      user?.full_name ||
      this.getUser(user?.id)?.full_name ||
      user?.username ||
      this.getUser(user?.id)?.username ||
      ''
    );
  }
  getFullName(user?: User): string {
    return user?.full_name || this.getUser(user?.id)?.full_name.trim() || '';
  }
  getUsername(user?: User): string {
    return user?.username || this.getUser(user?.id)?.username.trim() || '';
  }
  getUserByUsername(username: string): User {
    return this.userMapByUsername.get(username);
  }
  getIsAdmin(user?: User): boolean {
    return user?.is_admin || this.getUser(user?.id)?.is_admin;
  }
  getIsExternal(user?: User): boolean {
    return (
      user?.type === 'external' || this.getUser(user?.id)?.type === 'external'
    );
  }
  getIsCurrent(id: string): boolean {
    return id && this.currentUserValue && this.currentUserValue.id === id;
  }
  getIsOnline(id: string): boolean {
    return this.onlineMap.getValue().get(id) || false;
  }
  getTimeZone(user?: User): string {
    return user?.settings.time_zone_name ||
      this.getUser(user?.id)?.settings.time_zone_name ||
      globalThis.Intl
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : '';
  }
  updatePersonalTodos(): void {
    this.dataService.getPersonalTodos().subscribe((todos) => {
      this.todos.next(todos);
    });
  }
  savePersonalTodos(todos: IssueTodo[]): void {
    this.dataService.savePersonalTodos(todos).subscribe((todos) => {
      this.todos.next(todos);
    });
  }

  addUserAndInvite(user: User) {
    return this.dataService
      .inviteNewUser(user)
      .pipe(tap((u) => this.setUser(u.id, u)));
  }
  addUser(user: User) {
    return this.dataService
      .addUser(user)
      .pipe(tap((u) => this.setUser(u.id, u)));
  }
  inviteUser(user: User) {
    return this.dataService
      .inviteOldUser(String(user.id), user)
      .pipe(tap((u) => this.setUser(u.id, u)));
  }
}
