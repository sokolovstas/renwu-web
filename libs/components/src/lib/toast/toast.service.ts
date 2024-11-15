import { Injectable } from '@angular/core';
import { ToastData } from './toast/toast.component';

@Injectable({
  providedIn: 'root',
})
export class RwToastService {
  toasts: ToastData[] = [];
  error(text: string): void {
    this.add({
      ...{ timeout: 5000, level: 'error', persistant: false },
      text,
    });
  }
  clear(text: string): void {
    for (const toast of this.toasts) {
      if (toast.text === text) {
        const index = this.toasts.indexOf(toast);
        this.toasts.splice(index, 1);
      }
    }
  }
  warn(text: string): void {
    this.add({
      ...{ timeout: 3000, level: 'warn', persistant: true },
      text,
    });
  }
  info(text: string): void {
    this.add({ ...{ timeout: 3000, level: 'info' }, text });
  }
  success(text: string): void {
    this.add({
      ...{ timeout: 3000, level: 'success' },
      text,
    });
  }
  add(toast: ToastData): void {
    for (let i = 0; i < this.toasts.length; ++i) {
      if (this.toasts[i].text === toast.text) {
        return;
      }
    }
    if (toast.handler) {
      toast.handler();
    }
    toast.hide = true;
    this.toasts.push(toast);
    if (!toast.persistant) {
      globalThis.setTimeout(() => {
        this.close(toast);
      }, toast.timeout);
    }
    globalThis.setTimeout(() => {
      toast.hide = false;
    }, 100);
  }
  close(toast: ToastData): void {
    toast.hide = true;
    globalThis.setTimeout(() => {
      const index = this.toasts.indexOf(toast);
      this.toasts.splice(index, 1);
    }, 500);
  }
}
