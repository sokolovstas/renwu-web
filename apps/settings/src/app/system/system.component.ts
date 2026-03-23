import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';


@Component({
  selector: 'renwu-settings-system',
  standalone: true,
  imports: [RenwuPageComponent, TranslocoPipe],
  templateUrl: './system.component.html',
  styleUrl: './system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemComponent {}
