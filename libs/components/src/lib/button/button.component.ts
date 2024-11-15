import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { IconSize, RwIconComponent } from '../icon/icon.component';
import { IconName } from '../icon/list';

export type RwButtonType =
  | 'tab'
  | 'link'
  | 'type'
  | 'icon'
  | 'primary'
  | 'secondary';
@Component({
  selector: 'rw-button',
  standalone: true,
  imports: [RwIconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwButtonComponent {
  clickCount = 0;

  @Input()
  @HostBinding()
  tabindex = 0;

  @Output()
  clicked = new EventEmitter<void>();

  @Input()
  text: string;

  @Input()
  disabled: boolean;

  @Input()
  @HostBinding('class')
  typeButton: RwButtonType = 'primary';

  @Input()
  iconClass: IconName;

  @Input()
  iconSize: IconSize = 'large';

  @Input()
  selected: boolean;

  @Input()
  double: boolean;

  @Input()
  color: string;

  @Input()
  backgroundColor: string;

  @Input()
  borderColor: string;

  @Input()
  padding: string;

  @Input()
  borderRadius: string;

  @Input()
  timeout = 50;

  @Input()
  inProgress: boolean;

  @Input()
  isAttention: boolean;

  @HostListener('keydown', ['$event'])
  onKeyDownListener(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!this.disabled) {
        this.onClick();
      }
    }
  }

  @HostListener('mouseleave', ['$event'])
  onmouseleave(): void {
    this.clickCount = 0;
  }

  constructor(private cd: ChangeDetectorRef) {}

  onClickButton(): void {
    if (!this.disabled && !this.inProgress) {
      this.onClick();
    }
  }
  onClick(): void {
    if (this.double) {
      this.clickCount++;
      this.cd.markForCheck();
      if (this.clickCount === 2) {
        this.clicked.next();
      }
    } else {
      if (this.timeout === 0) {
        this.clicked.next();
      } else {
        globalThis.setTimeout(() => {
          this.clicked.next();
        }, this.timeout);
      }
    }
  }
}
