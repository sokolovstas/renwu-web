import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwPageComponent } from '@renwu/app-ui';

@Component({
  selector: 'renwu-settings-calendars',
  standalone: true,
  imports: [RwPageComponent, TranslocoPipe],
  templateUrl: './calendars.component.html',
  styleUrl: './calendars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarsComponent {}
