import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BoardGroupComponent,
  RwBoardService,
  RwGroupService,
} from '@renwu/board';
import { RwSearchService } from '@renwu/core';
import { combineLatest, map, switchMap } from 'rxjs';

@Component({
  selector: 'renwu-boards-board',
  standalone: true,
  imports: [BoardGroupComponent, AsyncPipe],
  providers: [RwGroupService],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  route = inject(ActivatedRoute);
  boardService = inject(RwBoardService);
  groupService = inject(RwGroupService);
  searchService = inject(RwSearchService);
  board = this.route.paramMap.pipe(
    map((p) => p.get('id')),
    switchMap((id) => this.boardService.getBoard(id)),
  );
  tasks = this.searchService.search('closed="false"', '');
  rootGroup = combineLatest([this.board, this.tasks]).pipe(
    switchMap(([config, tasks]) => {
      return this.groupService.group(tasks.issues, config);
    }),
  );
}
