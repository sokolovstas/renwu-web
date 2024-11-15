import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuePriorityComponent } from './shared/issue-fields/priority/priority.component';

describe('IssuePriorityComponent', () => {
  let component: IssuePriorityComponent;
  let fixture: ComponentFixture<IssuePriorityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RwModule],
      declarations: [IssuePriorityComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuePriorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
