import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RwBoardService } from '@renwu/board';

@Component({
  selector: 'renwu-boards-main',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  boards = inject(RwBoardService).boards;
}
