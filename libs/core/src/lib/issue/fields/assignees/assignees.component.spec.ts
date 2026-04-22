import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueAssigneesComponent } from './assignees.component';

describe('IssueAssigneesComponent', () => {
  let fixture: ComponentFixture<IssueAssigneesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueAssigneesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueAssigneesComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
