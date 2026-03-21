import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { CoreModule } from './core/core.module';
import { IssueService } from './issue/issue.service';
import { IssueHrefComponent } from './shared/issue-href/issue-href.component';

describe('HrefComponent', () => {
  let component: IssueHrefComponent;
  let fixture: ComponentFixture<IssueHrefComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RwModule, CoreModule],
      declarations: [IssueHrefComponent],
      providers: [IssueService, provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueHrefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
