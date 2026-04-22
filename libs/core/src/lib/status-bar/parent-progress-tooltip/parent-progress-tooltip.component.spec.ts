import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParentProgressTooltipComponent } from './parent-progress-tooltip.component';

describe('ParentProgressTooltipComponent', () => {
  let fixture: ComponentFixture<ParentProgressTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentProgressTooltipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentProgressTooltipComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
