import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-task-links',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksComponent {}
