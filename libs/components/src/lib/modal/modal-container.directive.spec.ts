import { TestBed, waitForAsync } from '@angular/core/testing';
import { RwModalContainerDirective } from './modal-container.directive';

describe('RwModalContainerDirective', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwModalContainerDirective],
    }).compileComponents();
  }));
  it('configures TestBed', () => {
    expect(TestBed).toBeTruthy();
  });

});
