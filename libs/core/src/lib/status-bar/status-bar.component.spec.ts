import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssuesStatusBarComponent } from './status-bar.component';

describe('IssuesStatusBarComponent', () => {
  let fixture: ComponentFixture<IssuesStatusBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuesStatusBarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuesStatusBarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
