import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TextWithTooltipComponent } from './text-with-tooltip.component';

describe('TextWithTooltipComponent', () => {
  let component: TextWithTooltipComponent;
  let fixture: ComponentFixture<TextWithTooltipComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      declarations: [TextWithTooltipComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextWithTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
