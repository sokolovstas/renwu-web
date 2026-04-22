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
});
