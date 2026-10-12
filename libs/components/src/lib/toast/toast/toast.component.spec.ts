import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RwToastComponent } from './toast.component';
import { RwToastService } from '../toast.service';

describe('RwToastComponent', () => {
  let fixture: ComponentFixture<RwToastComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwToastComponent],
      providers: [
        {
          provide: RwToastService,
          useClass: class {
            close = () => undefined;
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwToastComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the close control when the toast is persistent', () => {
    fixture.componentInstance.persistant = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.item-close')).toBeTruthy();
  });

  it('hides the close control when the toast auto-dismisses', () => {
    fixture.componentInstance.persistant = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.item-close')).toBeFalsy();
  });
});
