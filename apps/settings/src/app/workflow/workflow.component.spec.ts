import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { RwToastService } from '@renwu/components';
import { RwContainerService, RwDataService } from '@renwu/core';
import { of } from 'rxjs';
import { WorkflowComponent } from './workflow.component';

describe('WorkflowComponent', () => {
  let fixture: ComponentFixture<WorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowComponent],
      providers: [
        FormBuilder,
        provideRouter([]),
        {
          provide: RwContainerService,
          useValue: {
            statusMap: new Map(),
          },
        },
        {
          provide: RwDataService,
          useValue: {
            getWorkflow: jest.fn().mockReturnValue(of(null)),
          },
        },
        { provide: RwToastService, useValue: { error: jest.fn() } },
      ],
    })
      .overrideComponent(WorkflowComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkflowComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
