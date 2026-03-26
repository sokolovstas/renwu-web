import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import moment from 'moment';

@Component({
  selector: 'renwu-timeline-scale',
  standalone: true,
  templateUrl: './timeline-scale.component.html',
  styleUrl: './timeline-scale.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
})
export class TimelineScaleComponent {
  @Input() dateStart!: moment.Moment;
  @Input() dateEnd!: moment.Moment;
  @Input() isWorkload = false;

  @Input()
  set scaleTick(value: { id: string } | string | null) {
    if (typeof value === 'string') {
      this._scaleTickId = value;
      return;
    }
    this._scaleTickId = value?.id ?? null;
  }
  get scaleTick(): string | null {
    return this._scaleTickId;
  }
  private _scaleTickId: string | null = null;

  scaleValue = 100;

  @Output() changed = new EventEmitter<void>();
  @Output() fitToScreen = new EventEmitter<void>();

  onFit(): void {
    // Placeholder: real fit-to-screen logic will come in later phases.
    this.fitToScreen.emit();
  }

  notifyChanged(): void {
    this.changed.emit();
  }
}

