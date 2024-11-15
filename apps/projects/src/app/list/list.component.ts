import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RenwuPageComponent,
  RenwuPageWithSidebarComponent,
  RenwuTourAnchorDirective,
} from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwModalService,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';
import { RwFormatUserPipe } from '@renwu/core';
import { BehaviorSubject, combineLatest, map, switchMap, tap } from 'rxjs';
import { AddProjectComponent } from '../add-project/add-project.component';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-list',
  standalone: true,
  imports: [
    AsyncPipe,
    RenwuPageComponent,
    RenwuPageWithSidebarComponent,
    FormsModule,
    RouterLink,
    RwCheckboxComponent,
    RwSortTableDirective,
    RwSortTableRowDirective,
    RwSortTableColumnDirective,
    RwSortTableColumnHeadDirective,
    RwFormatUserPipe,
    RwButtonComponent,
    RenwuTourAnchorDirective,
    TranslocoPipe,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  showArchived = new BehaviorSubject<boolean>(false);
  containers = combineLatest([
    this.showArchived,
    this.projectService.projects,
  ]).pipe(
    map(([showArchived, projects]) =>
      showArchived ? projects : projects.filter((p) => !p.archived),
    ),
  );

  constructor(
    private projectService: ProjectService,
    private modalService: RwModalService,
  ) {}
  addProject() {
    const addModal = this.modalService.add(AddProjectComponent);
    addModal.added
      .pipe(
        switchMap((data) => this.projectService.addProject(data)),
        tap(() => this.modalService.close()),
      )
      .subscribe();
  }
}
