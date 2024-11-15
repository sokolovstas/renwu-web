
import { Component, EventEmitter, Input, Output } from '@angular/core';

export class ToastData {
  level?: 'error' | 'warn' | 'info' | 'success';
  text: string;
  hide?: boolean;
  timeout?: number;
  persistant?: boolean;
  handler?: () => void;
  onClick?: () => void;
}

@Component({
  selector: 'rw-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class RwToastComponent {
  @Input()
  level: 'error' | 'warn' | 'info' | 'success';

  @Input()
  text: string;

  @Input()
  hide: boolean;

  @Input()
  persistant: boolean;

  @Input()
  object: { onClick?: () => void };

  @Output()
  closeClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  @Output()
  toastClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
}
