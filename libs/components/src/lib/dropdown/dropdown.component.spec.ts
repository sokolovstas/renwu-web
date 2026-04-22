import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwDropDownComponent } from './dropdown.component';

describe('RwDropDownComponent', () => {
  let component: RwDropDownComponent;
  let fixture: ComponentFixture<RwDropDownComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwDropDownComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwDropDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
