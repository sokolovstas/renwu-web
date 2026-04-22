import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RwDataService } from '@renwu/core';
import { of } from 'rxjs';

import { HistoryComponent } from './history.component';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRwIssueServiceShellMock(),
        { provide: RwDataService, useValue: { getIssueEvents: jest.fn().mockReturnValue(of([])) } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
