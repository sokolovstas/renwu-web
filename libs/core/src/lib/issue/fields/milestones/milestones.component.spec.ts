import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueMilestonesComponent } from './milestones.component';

describe('IssueMilestonesComponent', () => {
  let fixture: ComponentFixture<IssueMilestonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueMilestonesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueMilestonesComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
