import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-settings-system',
  standalone: true,
  imports: [RwButtonComponent, RenwuPageComponent, TranslocoPipe],
  templateUrl: './system.component.html',
  styleUrl: './system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemComponent {}
