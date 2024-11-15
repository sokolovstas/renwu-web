import { TestBed, waitForAsync } from '@angular/core/testing';
import { ModalContainerDirective } from './modal-container.directive';

describe('ModalContainerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [ModalContainerDirective],
    }).compileComponents();
  }));
});
