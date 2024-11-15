import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RwButtonComponent } from '@renwu/components';

@Component({
  selector: 'renwu-tour-hint',
  standalone: true,
  imports: [CommonModule, RwButtonComponent],
  templateUrl: './tour-hint.component.html',
  styleUrl: './tour-hint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourHintComponent {
  @Input()
  title: string;

  @Input()
  text: string;

  @Input()
  next: string;

  @Input()
  step: number = 0;

  @Input()
  onNext: () => void;

  @Input()
  onPrev: () => void;

  @Input()
  onEnd: () => void;

  @Input()
  totalSteps: number = 0;
}
