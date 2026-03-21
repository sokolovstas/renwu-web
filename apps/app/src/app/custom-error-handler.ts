import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RwToastService } from '@renwu/components';

@Injectable()
export class CustomErrorHandler extends ErrorHandler {
  private injector = inject(Injector);

  constructor() {
    super();
  }

  get router(): Router {
    return this.injector.get<Router>(Router);
  }

  get toastService(): RwToastService {
    return this.injector.get<RwToastService>(RwToastService);
  }

  override handleError(err: unknown): void {
    super.handleError(err);
  }
}
