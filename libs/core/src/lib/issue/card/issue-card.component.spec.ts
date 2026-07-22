import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Issue } from '../issue.model';
import { IssueCardComponent } from './issue-card.component';

describe('IssueCardComponent', () => {
  let component: IssueCardComponent;
  let fixture: ComponentFixture<IssueCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueCardComponent);
    component = fixture.componentInstance;
    component.issue = { id: '1', key: 'T-1', title: 'Sample' } as Issue;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders key and title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('T-1');
    expect(el.textContent).toContain('Sample');
  });
});
