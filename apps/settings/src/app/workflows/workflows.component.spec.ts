import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwContainerService, RwDataService } from '@renwu/core';
import { of } from 'rxjs';
import { WorkflowsComponent } from './workflows.component';

describe('WorkflowsComponent', () => {
  let fixture: ComponentFixture<WorkflowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowsComponent],
      providers: [
        provideRouter([]),
        { provide: RwContainerService, useValue: { currentContainer: {} } },
        {
          provide: RwDataService,
          useValue: { getWorkflows: jest.fn().mockReturnValue(of([])) },
        },
      ],
    })
      .overrideComponent(WorkflowsComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkflowsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
