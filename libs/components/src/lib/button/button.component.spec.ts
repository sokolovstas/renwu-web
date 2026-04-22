import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RwIconComponent } from '../icon/icon.component';
import { RwButtonComponent } from './button.component';

describe('RwButtonComponent', () => {
  let component: RwButtonComponent;
  let fixture: ComponentFixture<RwButtonComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwButtonComponent, RwIconComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
