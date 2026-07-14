import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuPageWithSidebarComponent } from '@renwu/app-ui';
import { RwBoardService } from '@renwu/board';

@Component({
  selector: 'renwu-boards-main',
  standalone: true,
  imports: [
    AsyncPipe,
    RenwuPageWithSidebarComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  private readonly boardService = inject(RwBoardService);
  private readonly destroyRef = inject(DestroyRef);

  boards = this.boardService.boards;

  constructor() {
    this.boardService
      .loadBoards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
