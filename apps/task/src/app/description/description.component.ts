import { Component, Injector, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwTextAreaComponent } from '@renwu/components';
import { RwIssueService } from '@renwu/core';

@Component({
  selector: 'renwu-task-description',
  standalone: true,
  imports: [RwTextAreaComponent, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './description.component.html',
  styleUrl: './description.component.scss',
})
export class DescriptionComponent implements OnInit {
  injector: Injector;

  issueService = inject(RwIssueService);

  ngOnInit() {
    // this.issueService = this.injector.get(RwIssueService);
    return;
  }
}
