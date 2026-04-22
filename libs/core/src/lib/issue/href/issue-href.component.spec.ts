import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IssueHrefComponent } from './issue-href.component';

describe('IssueHrefComponent', () => {
  let fixture: ComponentFixture<IssueHrefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueHrefComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueHrefComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
