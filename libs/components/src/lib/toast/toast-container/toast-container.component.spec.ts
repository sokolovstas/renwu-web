import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RwToastContainerComponent } from './toast-container.component';

describe('RwToastContainerComponent', () => {
  let fixture: ComponentFixture<RwToastContainerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwToastContainerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwToastContainerComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
