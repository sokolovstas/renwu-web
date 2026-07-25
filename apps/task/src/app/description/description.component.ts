import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwTextAreaComponent } from '@renwu/components';
import {
  createMentionEditorExtras,
  MentionEditorExtras,
  RwIssueService,
} from '@renwu/core';

@Component({
  selector: 'renwu-task-description',
  standalone: true,
  imports: [RwTextAreaComponent, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './description.component.html',
  styleUrl: './description.component.scss',
})
export class DescriptionComponent {
  issueService = inject(RwIssueService);
  mentionEditor: MentionEditorExtras = { plugins: [], nodeViews: {} };

  constructor() {
    try {
      this.mentionEditor = createMentionEditorExtras();
    } catch (err) {
      console.error('description: mention editor init failed', err);
    }
  }
}
