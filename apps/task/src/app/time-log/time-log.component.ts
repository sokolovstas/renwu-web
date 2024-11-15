import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-time-log',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './time-log.component.html',
  styleUrl: './time-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogComponent {}
