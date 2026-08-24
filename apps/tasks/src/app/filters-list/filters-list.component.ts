import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwModalService,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';
import { RwDataService, RwSearchService, SavedSearchQuery } from '@renwu/core';
import { switchMap, tap } from 'rxjs';
import { SaveFilterComponent } from '../save-filter/save-filter.component';

@Component({
  selector: 'renwu-tasks-filters-list',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    RwPageComponent,
    RouterLink,
    RouterLinkActive,
    RwButtonComponent,
    RwCheckboxComponent,
    RwSortTableDirective,
    RwSortTableRowDirective,
    RwSortTableColumnDirective,
    RwSortTableColumnHeadDirective,
    TranslocoPipe,
  ],
  templateUrl: './filters-list.component.html',
  styleUrl: './filters-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersListComponent {
  private readonly searchService = inject(RwSearchService);
  private readonly dataService = inject(RwDataService);
  private readonly modalService = inject(RwModalService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  queries = this.searchService.savedQueries;

  addFilter(): void {
    const modal = this.modalService.add(SaveFilterComponent, {
      filter: null,
      queryString: 'closed="false"',
    });
    modal.saved
      .pipe(
        switchMap((filter) => this.dataService.addSearchQuery(filter)),
        tap(() => {
          this.searchService.updateSaved.next();
          this.modalService.close();
        }),
      )
      .subscribe((created) => {
        void this.router.navigate([created.id], {
          relativeTo: this.route.parent,
        });
      });
  }
}
