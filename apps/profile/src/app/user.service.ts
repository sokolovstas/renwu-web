import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@ngneat/transloco';
import { RwToastService } from '@renwu/components';
import { RwDataService, RwUserService, StateService, User } from '@renwu/core';
import { filterFalsy } from '@renwu/utils';
import { BehaviorSubject, switchMap, tap } from 'rxjs';

@Injectable()
export class UserService {
  destroy = inject(DestroyRef);
  currentUserKey = new BehaviorSubject<string>('');
  currentUser = new BehaviorSubject<User>(null);
  transloco = inject(TranslocoService);
  constructor(
    private dataService: RwDataService,
    private userService: RwUserService,
    private toastService: RwToastService,
    private stateService: StateService,
  ) {
    this.currentUserKey
      .pipe(
        filterFalsy(),
        switchMap((k) =>
          k === 'me'
            ? this.userService.currentUser
            : this.dataService.getUserByUsername(k),
        ),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(this.currentUser);
  }

  saveUser(user: Partial<User>) {
    return this.userService
      .saveUser(user.id, {
        ...this.userService.currentUser.getValue(),
        ...user,
        ...{
          settings: {
            time_zone_name: user.settings.time_zone_name,
            profile: {
              ...this.userService.currentUser.getValue().settings.profile,
              ...user.settings.profile,
            },
            notifications: {
              ...this.userService.currentUser.getValue().settings.notifications,
              ...user.settings.notifications,
            },
          },
        },
      } as User)
      .pipe(
        tap(() => {
          this.stateService.setFromProfile(
            this.userService.getUser().settings.profile,
          );
        }),
        tap(() => {
          this.toastService.success(
            this.transloco.translate('profile.profile-saved'),
          );
        }),
      );
  }
  // saveTemplate(issue: Issue) {
  //   return this.currentProject.pipe(
  //     take(1),
  //     switchMap((p) =>
  //       this.dataService.saveContainer(p.id, {
  //         ...p,
  //         settings: {
  //           ...p.settings,
  //           issue: issue,
  //         },
  //       })
  //     ),
  //     tap((c) => this.containerService.updateContainers([c]))
  //   );
  // }
  // saveTeam(team: Team[]) {
  //   return this.currentProject.pipe(
  //     take(1),
  //     switchMap((p) =>
  //       this.dataService.saveContainer(p.id, {
  //         ...p,
  //         team,
  //       })
  //     ),
  //     tap((c) => this.containerService.updateContainers([c]))
  //   );
  // }
  // addUserTo(
  //   user: User,
  //   collection: 'external' | 'internal' | 'managers' | 'admins'
  // ) {
  //   return this.currentProject.pipe(
  //     take(1),
  //     switchMap((p) => {
  //       switch (collection) {
  //         case 'external':
  //         case 'internal':
  //           if (p.team.findIndex((t) => t.user.id === user.id) === -1) {
  //             p.team.push({ user });
  //           }
  //           break;
  //         case 'managers':
  //           if (p.managers.findIndex((t) => t.id === user.id) === -1) {
  //             p.managers.push(user);
  //           }
  //           break;
  //         case 'admins':
  //           if (p.admins.findIndex((t) => t.id === user.id) === -1) {
  //             p.admins.push(user);
  //           }
  //           break;
  //       }
  //       return this.dataService.saveContainer(p.id, {
  //         ...p,
  //       });
  //     }),
  //     tap((c) => this.containerService.updateContainers([c]))
  //   );
  // }
  // removeUserFrom(
  //   user: User,
  //   collection: 'external' | 'internal' | 'managers' | 'admins'
  // ) {
  //   return this.currentProject.pipe(
  //     take(1),
  //     switchMap((p) => {
  //       switch (collection) {
  //         case 'external':
  //         case 'internal':
  //           p.team = p.team.filter((u) => u.user.id !== user.id);
  //           break;
  //         case 'managers':
  //           p.managers = p.managers.filter((u) => u.id !== user.id);
  //           break;
  //         case 'admins':
  //           p.admins = p.admins.filter((u) => u.id !== user.id);
  //           break;
  //       }
  //       return this.dataService.saveContainer(p.id, {
  //         ...p,
  //       });
  //     }),
  //     tap((c) => this.containerService.updateContainers([c]))
  //   );
  // }
}
