import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwPageComponent,
  RwPageWithSidebarComponent,
} from '@renwu/app-ui';
import { SearchSpotlightComponent } from '../spotlight/spotlight.component';

@Component({
  selector: 'renwu-search-main',
  standalone: true,
  imports: [
    RwPageComponent,
    RwPageWithSidebarComponent,
    SearchSpotlightComponent,
    TranslocoPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {}
