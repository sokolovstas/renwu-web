import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwModalService,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';
import {
  AvatarComponent,
  RwFormatUserPipe,
  RwUserService,
  User,
} from '@renwu/core';
import { AddUserComponent } from '../add-user/add-user.component';

@Component({
  selector: 'renwu-settings-users',
  standalone: true,
  imports: [
    RwButtonComponent,
    AsyncPipe,
    RwFormatUserPipe,
    RwSortTableDirective,
    RwSortTableRowDirective,
    RwSortTableColumnDirective,
    RwSortTableColumnHeadDirective,
    AvatarComponent,
    RenwuPageComponent,
    TranslocoPipe,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  users = inject(RwUserService).userList;
  onlineMap = inject(RwUserService).onlineMap;
  modalService = inject(RwModalService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  addUser() {
    const user: User = {};
    this.modalService.add(AddUserComponent, {
      user,
    });
  }
  openUser(user: User) {
    this.router.navigate([user.id], { relativeTo: this.route });
  }
}
