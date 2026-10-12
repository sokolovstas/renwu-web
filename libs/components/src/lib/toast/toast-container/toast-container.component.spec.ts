import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RwToastContainerComponent } from './toast-container.component';
import { RwToastService } from '../toast.service';
import { ToastData } from '../toast/toast.component';

describe('RwToastContainerComponent', () => {
  let fixture: ComponentFixture<RwToastContainerComponent>;
  let toastService: RwToastService;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwToastContainerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwToastContainerComponent);
    toastService = TestBed.inject(RwToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not close an error toast on body click', () => {
    const close = jest.spyOn(toastService, 'close');
    const toast: ToastData = {
      text: 'failed',
      level: 'error',
      persistant: true,
    };
    fixture.componentInstance.clickToast(toast);
    expect(close).not.toHaveBeenCalled();
  });

  it('closes a success toast on body click', () => {
    const close = jest.spyOn(toastService, 'close');
    const toast: ToastData = {
      text: 'saved',
      level: 'success',
    };
    fixture.componentInstance.clickToast(toast);
    expect(close).toHaveBeenCalledWith(toast);
  });
});
