import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  RwAlertComponent,
  RwAlertService,
  RwModalContainerDirective,
  RwModalService,
  RwToastContainerComponent,
  RwTooltipContainerComponent,
} from '@renwu/components';

@Component({
  selector: 'renwu-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RwAlertComponent,
    RwModalContainerDirective,
    RwToastContainerComponent,
    RwTooltipContainerComponent,
  ],
  template: `<router-outlet></router-outlet>
    <div
      class="rw-modal-container"
      rwModalContainer
      [class.hidden-important]="(modalService.opened | async) === false"
    >
      <div #modalContainer></div>
    </div>
    @if (alertService.current) {
      <rw-alert [alert]="alertService.current"></rw-alert>
    }
    <rw-toast-container></rw-toast-container>
    <rw-tooltip-container></rw-tooltip-container>`,
})
export class AppComponent {
  alertService = inject(RwAlertService);
  modalService = inject(RwModalService);
}
