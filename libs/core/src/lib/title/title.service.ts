import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RwWebsocketService } from '../websocket/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class RwTitleService {
  private title = inject(Title);
  private websocketService = inject(RwWebsocketService);

  constructor() {
    this.websocketService.clearView();
    this.websocketService.pushView('RENWU');
    this.websocketService.sendView();
  }

  updateTitle() {
    this.websocketService.clearView();

    const titles: string[] = [];

    titles.push('RENWU');
    this.title.setTitle(titles.join(' | '));
    this.websocketService.sendView();
  }
}
