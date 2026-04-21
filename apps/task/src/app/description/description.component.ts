import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwTextAreaComponent } from '@renwu/components';
import { RwIssueService } from '@renwu/core';

@Component({
  selector: 'renwu-task-description',
  standalone: true,
  imports: [RwTextAreaComponent, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './description.component.html',
  styleUrl: './description.component.scss',
})
export class DescriptionComponent {
  issueService = inject(RwIssueService);
}
