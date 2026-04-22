import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwIconComponent } from './icon.component';

describe('RwIconComponent', () => {
  let component: RwIconComponent;
  let fixture: ComponentFixture<RwIconComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwIconComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
