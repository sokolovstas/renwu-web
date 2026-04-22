import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwTooltipService } from '../tooltip.service';
import { RwTooltipContainerComponent } from './tooltip-container.component';

describe('RwTooltipContainerComponent', () => {
  let component: RwTooltipContainerComponent;
  let fixture: ComponentFixture<RwTooltipContainerComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwTooltipContainerComponent],
      providers: [
        {
          provide: RwTooltipService,
          useClass: class {
            registerContainer = () => {
              return;
            };
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTooltipContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
