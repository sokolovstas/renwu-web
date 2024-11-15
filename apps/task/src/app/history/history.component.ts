import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-history',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {}
