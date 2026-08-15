import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SearchSpotlightComponent } from '../spotlight/spotlight.component';

@Component({
  selector: 'renwu-search-main',
  standalone: true,
  imports: [SearchSpotlightComponent],
  template: '<renwu-search-spotlight variant="page" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {}
