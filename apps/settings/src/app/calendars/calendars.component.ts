import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';

@Component({
  selector: 'renwu-settings-calendars',
  standalone: true,
  imports: [RenwuPageComponent, TranslocoPipe],
  templateUrl: './calendars.component.html',
  styleUrl: './calendars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarsComponent {}
