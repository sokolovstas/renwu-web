import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageComponent } from '@renwu/app-ui';
import { BoardGroupsConfig, RwBoardService } from '@renwu/board';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwSortTableColumnDirective,
  RwSortTableColumnHeadDirective,
  RwSortTableDirective,
  RwSortTableRowDirective,
} from '@renwu/components';

@Component({
  selector: 'renwu-boards-list',
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
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  private readonly boardService = inject(RwBoardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  boards = this.boardService.boards;

  createBoard(): void {
    const board = new BoardGroupsConfig('New board');
    this.boardService.addBoard(board).subscribe((created) => {
      void this.router.navigate([created.id], {
        relativeTo: this.route.parent,
      });
    });
  }
}
