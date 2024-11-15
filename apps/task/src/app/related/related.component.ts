import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-related',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './related.component.html',
  styleUrl: './related.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatedComponent {}
