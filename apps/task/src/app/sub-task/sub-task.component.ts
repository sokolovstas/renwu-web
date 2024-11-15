import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-sub-task',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './sub-task.component.html',
  styleUrl: './sub-task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubTaskComponent {}
