import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import { Placement } from '@floating-ui/dom';
import { RwTooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'rw-text-with-tooltip',
  standalone: true,
  imports: [RwTooltipDirective],
  templateUrl: './text-with-tooltip.component.html',
  styleUrl: './text-with-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwTextWithTooltipComponent {
  @Input()
  label: string;

  @Input()
  tooltipWidth: string;

  @Input()
  tooltipPlacement: Placement = 'top';

  @Input()
  textAlign: string;

  displayTooltip: boolean;

  @ViewChild('wrapper', { static: true })
  wrapper: ElementRef;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.displayTooltip = !(
      (this.wrapper.nativeElement as HTMLElement).scrollWidth >
      (this.wrapper.nativeElement as HTMLElement).offsetWidth
    );
    this.cd.detectChanges();
  }

  constructor(private cd: ChangeDetectorRef) {}
}
