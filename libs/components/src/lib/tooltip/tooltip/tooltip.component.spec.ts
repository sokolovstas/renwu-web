import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwTooltipComponent } from './tooltip.component';

describe('RwTooltipComponent', () => {
  let component: RwTooltipComponent;
  let fixture: ComponentFixture<RwTooltipComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwTooltipComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
