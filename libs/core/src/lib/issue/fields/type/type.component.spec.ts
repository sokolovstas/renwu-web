import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueTypeComponent } from './shared/issue-fields/type/type.component';

describe('IssueTypeComponent', () => {
  let component: IssueTypeComponent;
  let fixture: ComponentFixture<IssueTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RwModule],
      declarations: [IssueTypeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssueTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
