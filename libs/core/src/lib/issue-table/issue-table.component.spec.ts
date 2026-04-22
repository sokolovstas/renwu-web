import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RwIssueTableComponent } from './issue-table.component';

describe('RwIssueTableComponent', () => {
  let component: RwIssueTableComponent;
  let fixture: ComponentFixture<RwIssueTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RwIssueTableComponent],
    })
      .overrideComponent(RwIssueTableComponent, {
        set: {
          template: '',
          imports: [],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RwIssueTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
