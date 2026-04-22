import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueStatusComponent } from './status.component';

describe('IssueStatusComponent', () => {
  let fixture: ComponentFixture<IssueStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueStatusComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueStatusComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
