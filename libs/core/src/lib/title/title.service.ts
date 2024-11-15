import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RwWebsocketService } from '../websocket/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class RwTitleService {
  constructor(
    private title: Title,
    private websocketService: RwWebsocketService,
  ) {
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
