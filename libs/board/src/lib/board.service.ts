import { Injectable } from '@angular/core';
import {
  BoardGroupsConfigServer,
  RwDataService,
  RwSettingsService,
} from '@renwu/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { BoardGroupsConfig } from './board.model';

@Injectable({
  providedIn: 'root',
})
export class RwBoardService {
  boards = new BehaviorSubject<BoardGroupsConfig[]>([]);
  // favBoards = new BehaviorSubject<BoardGroupsConfig[]>([]);

  constructor(
    private settingsService: RwSettingsService,
    private dataService: RwDataService,
  ) {
    return;
  }

  init(): Observable<BoardGroupsConfigServer[]> {
    return this.loadBoards();
  }

  loadBoards(): Observable<BoardGroupsConfigServer[]> {
    return this.dataService.getBoards().pipe(
      tap((b) => {
        const boards = new Array<BoardGroupsConfig>();
        const favBoards = new Array<BoardGroupsConfig>();
        b.map((board) => BoardGroupsConfig.fromServer(board)).forEach(
          (board) => {
            // if (this.settingsService.user.fav_boards.indexOf(board.id) > -1) {
            // board.fav = true;
            // favBoards.push(board);
            // }
            boards.push(board);
          },
        );
        this.boards.next(boards);
        // this.favBoards.next(favBoards);
      }),
    );
  }

  updateBoardsList(): void {
    this.loadBoards().subscribe();
  }

  getBoard(id: string): Observable<BoardGroupsConfig> {
    return this.boards.pipe(map((a) => a.find((b) => b.id === id)));
  }

  // switchFavBoard(board: BoardGroupsConfig): void {
  //   const position: number = this.settingsService.user.fav_boards.indexOf(
  //     board.id
  //   );
  //   if (position > -1) {
  //     this.settingsService.user.fav_boards.splice(position, 1);
  //     this.settingsService.user.fav_boards = JSONUtils.jsonClone(
  //       this.settingsService.user.fav_boards
  //     );
  //   } else {
  //     this.settingsService.user.fav_boards.push(board.id);
  //     this.settingsService.user.fav_boards = JSONUtils.jsonClone(
  //       this.settingsService.user.fav_boards
  //     );
  //   }
  //   this.updateBoardsList();
  // }
}
