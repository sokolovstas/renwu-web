import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RwWebsocketService } from '../websocket/websocket.service';

export class Loader {
  progress: number;
  onSetProgress: (value: number) => void;
  timeout: number;

  setProgress(value: number): void {
    this.progress = value;
    if (this.onSetProgress) {
      this.onSetProgress(value);
    }
    globalThis.clearTimeout(this.timeout);
    if (value !== 100) {
      this.timeout = globalThis.setTimeout(() => {
        this.setProgress(100);
      }, 60000);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class RwLoaderService {
  @Output()
  loadingProgress = new EventEmitter<number>();

  loaderState = new BehaviorSubject<'none' | 'start' | 'hidden'>('none');
  workbotState = new BehaviorSubject<'none' | 'start' | 'hidden'>('none');
  loadingNoneTimeout = 0;
  // loadingNone = true;
  loaderStarted: boolean;

  workbotNoneTimeout = 0;

  startTimeout = 0;
  hideTimeout = 0;

  loaders: Loader[] = [];

  constructor(private websocketService: RwWebsocketService) {
    this.websocketService.workbot.subscribe((event) => {
      if (event.type === 'start') {
        this.setWorkbot(true);
      }
      if (event.type === 'end') {
        this.setWorkbot(false);
      }
    });
  }

  setLoader(): Loader {
    const loader = new Loader();
    loader.progress = 0;
    loader.onSetProgress = () => {
      this.updateProgress();
    };
    loader.timeout = globalThis.setTimeout(() => {
      loader.setProgress(100);
    }, 60000);

    if (this.loaders.length === 0) {
      // this.loaderState.next('start');
      globalThis.clearTimeout(this.loadingNoneTimeout);
      globalThis.clearTimeout(this.startTimeout);
      this.startTimeout = globalThis.setTimeout(() => {
        this.loaderStarted = false;
        this.updateProgress();
      }, 300);
    }
    this.loaders.push(loader);

    return loader;
  }
  updateProgress(): void {
    if (this.loaderStarted) {
      return;
    }
    let total = 0;
    for (let l = 0; l < this.loaders.length; l++) {
      total += this.loaders[l].progress;
    }
    if (this.loaders.length) {
      const progress = total / this.loaders.length;
      if (progress === 100) {
        this.loaders = [];
        this.setLoading(false);
        this.loadingProgress.next(100);
      } else {
        this.setLoading(true);
        this.loadingProgress.next(progress);
      }
    }
  }

  setLoading(value: boolean): void {
    globalThis.clearTimeout(this.loadingNoneTimeout);
    if (!value) {
      this.loaderState.next('hidden');
      this.loadingNoneTimeout = globalThis.setTimeout(() => {
        this.loaderState.next('none');
      }, 500);
    } else {
      this.loaderState.next('start');
    }
  }

  setWorkbot(value: boolean): void {
    globalThis.clearTimeout(this.workbotNoneTimeout);
    if (!value) {
      this.workbotState.next('hidden');
      this.workbotNoneTimeout = globalThis.setTimeout(() => {
        this.workbotState.next('none');
      }, 500);
    } else {
      this.workbotState.next('start');
    }
  }
}
