import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RwTextWithTooltipComponent } from './text-with-tooltip.component';

describe('RwTextWithTooltipComponent', () => {
  let component: RwTextWithTooltipComponent;
  let fixture: ComponentFixture<RwTextWithTooltipComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwTextWithTooltipComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTextWithTooltipComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
