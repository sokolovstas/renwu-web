import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  ViewEncapsulation,
} from '@angular/core';
import { IconName } from './list';

export type IconSize =
  | 'small'
  | 'normal'
  | 'large'
  | 'x-large'
  | 'xx-large'
  | 'inherit';
@Component({
  selector: 'rw-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RwIconComponent implements OnChanges {
  @Input()
  icon: IconName;

  // Size small, normal, large, x-large
  @Input()
  size: IconSize = 'inherit';

  @Input()
  cursor: 'inherit' | 'pointer' | 'move' = 'inherit';

  @Input()
  states: Record<string, IconName>;

  @Input()
  state: string | number | boolean;

  @Input()
  boolState: boolean;

  ngOnChanges(): void {
    let key = this.state;
    if (this.boolState !== undefined) {
      key = this.boolState ? 'true' : 'false';
    }
    this.icon = this.states?.[key.toString()] || this.icon;
  }
}
