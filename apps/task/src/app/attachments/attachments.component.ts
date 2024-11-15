import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-attachments',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentsComponent {}
