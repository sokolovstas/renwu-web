import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDatePipe,
  RwIconComponent,
  RwModalService,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
  RwSortTableRowHandlerDirective,
  SortCompletedEvent,
} from '@renwu/components';
import {
  Container,
  Milestone,
  RwContainerService,
  RwDataService,
  RwWebsocketService,
} from '@renwu/core';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AddMilestoneComponent } from '../add-milestone/add-milestone.component';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-milestones',
  standalone: true,
  imports: [
    AsyncPipe,
    RwCheckboxComponent,
    RenwuPageComponent,
    RwButtonComponent,
    RouterLink,
    RwSortTableColumnDirective,
    RwSortTableColumnHeadDirective,
    RwSortTableDirective,
    RwSortTableRowDirective,
    RouterLinkActive,
    RwDatePipe,
    RwSortTableRowHandlerDirective,
    FormsModule,
    RwIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './milestones.component.html',
  styleUrl: './milestones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestonesComponent {
  containerService = inject(RwContainerService);
  projectService = inject(ProjectService);
  modalService = inject(RwModalService);
  dataService = inject(RwDataService);

  currentProject = this.projectService.currentProject;
  showArchived = new BehaviorSubject<boolean>(false);
  ws = inject(RwWebsocketService);
  milestones = combineLatest([
    this.showArchived,
    this.projectService.currentProject,
  ]).pipe(
    switchMap(([showArchived, container]) => {
      return this.ws
        .onContainerEvent([container.id], ['container_milestone_update'])
        .pipe(
          map(() => [showArchived, container] as [boolean, Container]),
          startWith([showArchived, container] as [boolean, Container]),
        );
    }),
    switchMap(([showArchived, container]) =>
      this.containerService.getMilestones(
        container.id,
        showArchived ? undefined : false,
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  add() {
    const addModal = this.modalService.add(AddMilestoneComponent, {
      milestone: { container: this.projectService.currentProject.getValue() },
    });
    addModal.added
      .pipe(
        switchMap((data) => this.projectService.addMilestone(data)),
        tap(() => this.modalService.close()),
      )
      .subscribe();
  }
  async sortCompleted(event: SortCompletedEvent) {
    const milestones = await firstValueFrom(this.milestones);
    milestones.splice(
      event.newIndex,
      0,
      milestones.splice(event.oldIndex, 1)[0],
    );
    await firstValueFrom(
      this.dataService.sortMilestones(this.currentProject.getValue().id, {
        sort: milestones.map((v, i) => ({
          id: v.id,
          sort: Number.MAX_SAFE_INTEGER - i,
        })),
      }),
    );
  }
  edit(event: Event, milestone: Milestone) {
    event.stopImmediatePropagation();
    event.preventDefault();
    const addModal = this.modalService.add(AddMilestoneComponent, {
      milestone,
    });
    addModal.added
      .pipe(
        switchMap((data) => this.projectService.saveMilestone(data)),
        tap(() => this.modalService.close()),
      )
      .subscribe();
  }
}
