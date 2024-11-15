import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwSortTableColumnDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';
import { RwContainerService, RwDataService } from '@renwu/core';
import { shareReplay } from 'rxjs';

@Component({
  selector: 'renwu-settings-workflows',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    RenwuPageComponent,
    RwButtonComponent,
    RwSortTableDirective,
    RwSortTableColumnDirective,
    RwSortTableRowDirective,
    TranslocoPipe,
  ],
  templateUrl: './workflows.component.html',
  styleUrl: './workflows.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowsComponent {
  containerService = inject(RwContainerService);
  dataService = inject(RwDataService);
  workflows = this.dataService
    .getWorkflows()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
