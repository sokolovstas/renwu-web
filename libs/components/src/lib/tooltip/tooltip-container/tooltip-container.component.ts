import {
  Component,
  HostBinding,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { RwTooltipService } from '../tooltip.service';

@Component({
  selector: 'rw-tooltip-container',
  standalone: true,
  templateUrl: './tooltip-container.component.html',
  styleUrl: './tooltip-container.component.scss',
})
export class RwTooltipContainerComponent {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  target: ViewContainerRef;

  @HostBinding('class.active')
  active: boolean;

  title: string;

  constructor(public tooltipService: RwTooltipService) {
    this.tooltipService.registerContainer(this);
  }
}
