import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwButtonComponent } from '@renwu/components';
import { BoardGroupsConfig, RwBoardService } from '@renwu/board';
import { filter } from 'rxjs';

@Component({
  selector: 'renwu-boards-main',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    RouterOutlet,
    RwButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  private readonly boardService = inject(RwBoardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  boards = this.boardService.boards;

  constructor() {
    this.boardService
      .loadBoards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.boards
      .pipe(
        filter((boards) => boards.length > 0),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((boards) => {
        if (!this.route.firstChild?.snapshot.paramMap.get('id')) {
          void this.router.navigate([boards[0].id], { relativeTo: this.route });
        }
      });
  }

  createBoard(): void {
    const board = new BoardGroupsConfig('New board');
    this.boardService.addBoard(board).subscribe((created) => {
      void this.router.navigate([created.id], { relativeTo: this.route });
    });
  }
}
