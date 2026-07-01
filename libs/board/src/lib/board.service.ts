import { Injectable, inject } from '@angular/core';
import {
  BoardGroupsConfigServer,
  ResponseOk,
  RwDataService,
  RwUserService,
} from '@renwu/core';
import { BehaviorSubject, Observable, filter, map, tap } from 'rxjs';
import { BoardGroupsConfig } from './board.model';

@Injectable({
  providedIn: 'root',
})
export class RwBoardService {
  private dataService = inject(RwDataService);
  private userService = inject(RwUserService);

  boards = new BehaviorSubject<BoardGroupsConfig[]>([]);

  init(): Observable<BoardGroupsConfigServer[]> {
    return this.loadBoards();
  }

  loadBoards(): Observable<BoardGroupsConfigServer[]> {
    return this.dataService.getBoards().pipe(
      tap((b) => {
        const boards = b.map((board) => BoardGroupsConfig.fromServer(board));
        this.boards.next(boards);
      }),
    );
  }

  updateBoardsList(): void {
    this.loadBoards().subscribe();
  }

  /** Emits whenever the board with this id exists in the cached list (including after reload). */
  getBoard(id: string | null): Observable<BoardGroupsConfig> {
    return this.boards.pipe(
      map((list) => (id ? list.find((b) => b.id === id) : undefined)),
      filter((b): b is BoardGroupsConfig => b != null),
    );
  }

  saveBoard(config: BoardGroupsConfig): Observable<BoardGroupsConfigServer> {
    return this.dataService.saveBoard(config.toServer()).pipe(
      tap(() => this.updateBoardsList()),
    );
  }

  deleteBoard(id: string): Observable<ResponseOk> {
    return this.dataService.deleteBoard(id).pipe(
      tap(() => this.updateBoardsList()),
    );
  }

  addBoard(
    config: BoardGroupsConfig,
  ): Observable<BoardGroupsConfigServer> {
    config.authorId = config.authorId || this.userService.getId();
    return this.dataService.addBoard(config.toServer()).pipe(
      tap(() => this.updateBoardsList()),
    );
  }
}
