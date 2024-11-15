import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Component } from '@angular/core';
import { Issue } from './model/issue.model';
import { IssueAssigneesComponent } from './shared/issue-fields/assignees/assignees.component';

@Component({
  template: ` <issue-assignees [issue]="issue"></issue-assignees>`,
})
class TestHostComponent {
  issue: Issue;
}

describe('IssueMilestonesComponent', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  const getText = () => {
    return fixture.debugElement.nativeElement.textContent.trim();
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IssueAssigneesComponent, TestHostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should display -', () => {
    testHost.issue = null;
    fixture.detectChanges();
    expect(getText()).toBe('-');

    testHost.issue = {};
    fixture.detectChanges();
    expect(getText()).toBe('-');

    testHost.issue = {
      assignes: [],
      assignes_calc: [],
    };
    fixture.detectChanges();
    expect(getText()).toContain('❉');
    expect(getText()).toContain('Team');

    testHost.issue = {
      assignes: [{ username: 'test' }],
      assignes_calc: [],
    };
    fixture.detectChanges();
    expect(getText()).toBe('test');

    testHost.issue = {
      assignes: [],
      assignes_calc: [{ username: 'test' }, { full_name: 'test2' }],
    };
    fixture.detectChanges();
    expect(getText()).toContain('❉');
    expect(getText()).toContain('test, test2');
  });
});
