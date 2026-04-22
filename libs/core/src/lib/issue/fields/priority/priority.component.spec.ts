import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssuePriorityComponent } from './priority.component';

describe('IssuePriorityComponent', () => {
  let fixture: ComponentFixture<IssuePriorityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuePriorityComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuePriorityComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
