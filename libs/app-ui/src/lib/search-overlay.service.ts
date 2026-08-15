import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RenwuSearchOverlayService {
  readonly open = new BehaviorSubject(false);
  readonly open$ = this.open.asObservable();

  get isOpen(): boolean {
    return this.open.getValue();
  }

  show(): void {
    this.open.next(true);
  }

  hide(): void {
    this.open.next(false);
  }

  toggle(): void {
    this.open.next(!this.isOpen);
  }
}
