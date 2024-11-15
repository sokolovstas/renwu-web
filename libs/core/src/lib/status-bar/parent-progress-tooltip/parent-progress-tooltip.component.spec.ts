import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentProgressTooltipComponent } from './issue/status-bar/parent-progress-tooltip/parent-progress-tooltip.component';
import { SharedModule } from './shared/shared.module';

describe('ParentProgressTooltipComponent', () => {
  let component: ParentProgressTooltipComponent;
  let fixture: ComponentFixture<ParentProgressTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParentProgressTooltipComponent],
      imports: [RwModule, SharedModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentProgressTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
