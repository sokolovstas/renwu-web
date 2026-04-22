import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwCheckboxComponent } from './checkbox.component';

describe('RwCheckboxComponent', () => {
  let component: RwCheckboxComponent;
  let fixture: ComponentFixture<RwCheckboxComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwCheckboxComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
