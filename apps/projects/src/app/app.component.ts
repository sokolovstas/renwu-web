import { Component, inject } from '@angular/core';
import { RwAlertService, RwModalService } from '@renwu/components';

@Component({
  selector: 'renwu-projects',
  template: `<router-outlet></router-outlet>
    <div
      class="rw-modal-container"
      rwModalContainer
      [ngClass]="{
        'hidden-important': (modalService.opened | async) === false
      }"
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
