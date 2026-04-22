import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwRangeComponent } from './range.component';

describe('RwRangeComponent', () => {
  let component: RwRangeComponent;
  let fixture: ComponentFixture<RwRangeComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwRangeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
