
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RwToastService } from '../toast.service';
import { RwToastComponent, ToastData } from '../toast/toast.component';

@Component({
  selector: 'rw-toast-container',
  standalone: true,
  imports: [RwToastComponent],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RwToastContainerComponent {
  toastService = inject(RwToastService);


  clickToast(toast: ToastData): void {
    if (toast.onClick) {
      toast.onClick();
    }
    this.toastService.close(toast);
  }
  closeToast(toast: ToastData, eventMouser: MouseEvent): void {
    eventMouser.stopImmediatePropagation();
    this.toastService.close(toast);
  }
}
