import { AsyncPipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  ISelectItem,
  RwButtonComponent,
  RwSelectComponent,
} from '@renwu/components';
import {
  AvatarComponent,
  RwUserService,
  SelectModelUser,
  User,
  UserType,
} from '@renwu/core';
import { firstValueFrom, map } from 'rxjs';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-team',
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    RenwuPageComponent,
    AvatarComponent,
    RwSelectComponent,
    AvatarComponent,
    RwButtonComponent,
    FormsModule,
    TranslocoPipe,
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamComponent {
  currentProject = this.projectService.currentProject;
  internalTeam = this.currentProject.pipe(
    map((c) => c.team.filter((t) => !this.userService.getIsExternal(t.user))),
  );
  externalTeam = this.currentProject.pipe(
    map((c) => c.team.filter((t) => this.userService.getIsExternal(t.user))),
  );
  managers = this.currentProject.pipe(map((c) => c.managers));
  admins = this.currentProject.pipe(map((c) => c.admins));
  internalModelUser = new SelectModelUser();
  externalModelUser = new SelectModelUser();
  adminModelUser = new SelectModelUser();
  managerModelUser = new SelectModelUser();
  constructor(
    private projectService: ProjectService,
    private userService: RwUserService,
  ) {
    this.internalModelUser.filterFunction = (u: User) =>
      u.type === UserType.INTERNAL &&
      this.currentProject
        .getValue()
        .team.findIndex((t) => t.user.id === u.id) === -1;
    this.externalModelUser.filterFunction = (u: User) =>
      u.type === UserType.EXTERNAL &&
      this.currentProject
        .getValue()
        .team.findIndex((t) => t.user.id === u.id) === -1;

    this.adminModelUser.filterFunction = (u: User) =>
      this.currentProject.getValue().admins.findIndex((t) => t.id === u.id) ===
      -1;

    this.managerModelUser.filterFunction = (u: User) =>
      this.currentProject
        .getValue()
        .managers.findIndex((t) => t.id === u.id) === -1;
  }
  async addUserTo(
    user: ISelectItem<User>[],
    collection: 'external' | 'internal' | 'managers' | 'admins',
  ) {
    if (user?.[0]?.item) {
      await firstValueFrom(
        this.projectService.addUserTo(user[0].item, collection),
      );
    }
  }
  async removeUserFrom(
    user: User,
    collection: 'external' | 'internal' | 'managers' | 'admins',
  ) {
    if (user) {
      await firstValueFrom(
        this.projectService.removeUserFrom(user, collection),
      );
    }
  }
}
