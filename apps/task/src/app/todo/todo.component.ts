import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';

import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwIconComponent,
  RwSortTableDirective,
  RwSortTableRowDirective,
  RwSortTableRowHandlerDirective,
  RwTextAreaComponent,
  RwTextInputComponent,
  SortCompletedEvent,
} from '@renwu/components';
import { RwIssueService } from '@renwu/core';

@Component({
  selector: 'renwu-task-todo',
  standalone: true,
  imports: [
    RwTextAreaComponent,
    TranslocoPipe,
    ReactiveFormsModule,
    FormsModule,
    AsyncPipe,
    RwSortTableDirective,
    RwButtonComponent,
    RwCheckboxComponent,
    RwTextInputComponent,
    RwIconComponent,
    RwTextAreaComponent,
    RwSortTableRowDirective,
    RwSortTableRowHandlerDirective
],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss',
})
export class TodoComponent {
  issueService = inject(RwIssueService);
  cd = inject(ChangeDetectorRef);
  transloco = inject(TranslocoService);

  issueForm = this.issueService.issueForm;
  todos = this.issueService.issueForm.controls.todos;
  fb = new FormBuilder();
  newTodo = '';
  addTodo = false;

  @ViewChild('newTodoInput', { static: false })
  newTodoInput: RwTextAreaComponent;

  add() {
    const g = this.fb.group({
      is_done: this.fb.control(false),
      description: this.fb.control(this.newTodo),
    });
    this.todos.push(g);
    this.newTodo = '';
    this.cd.detectChanges();
  }
  openAdd() {
    this.addTodo = true;
    this.cd.detectChanges();
    this.newTodoInput.setFocus();
  }
  remove(index: number) {
    this.todos.removeAt(index);
  }
  sortCompleted(event: SortCompletedEvent) {
    const old = this.todos.at(event.oldIndex);
    this.todos.removeAt(event.oldIndex);
    this.todos.insert(event.newIndex, old);
  }
}
