import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueTypeComponent } from './type.component';

describe('IssueTypeComponent', () => {
  let fixture: ComponentFixture<IssueTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueTypeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueTypeComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
