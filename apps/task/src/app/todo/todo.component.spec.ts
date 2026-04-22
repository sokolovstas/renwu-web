import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoComponent } from './todo.component';
import { provideRwIssueServiceShellMock } from '../../testing/task-rw-issue-service.mock';
import { provideTranslocoStub } from '../../testing/transloco-stub';

describe('TodoComponent', () => {
  let component: TodoComponent;
  let fixture: ComponentFixture<TodoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodoComponent],
      providers: [provideTranslocoStub(), provideRwIssueServiceShellMock()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
