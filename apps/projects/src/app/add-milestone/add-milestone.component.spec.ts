import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMilestoneComponent } from './add-milestone.component';

describe('AddMilestoneComponent', () => {
  let component: AddMilestoneComponent;
  let fixture: ComponentFixture<AddMilestoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMilestoneComponent],
    })
      .overrideComponent(AddMilestoneComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddMilestoneComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
