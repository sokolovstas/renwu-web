import {
  Component,
  HostBinding,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

@Component({
  selector: 'rw-tooltip',
  standalone: true,
  templateUrl: 'tooltip.component.html',
  styleUrl: './tooltip.component.scss',
})
export class RwTooltipComponent {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  target: ViewContainerRef;

  @Input()
  text: string;

  @Input()
  @HostBinding('class.hide-back')
  hideBack: boolean;

  @HostBinding('style.white-space')
  whitespace: string;

  @HostBinding('style.width')
  width = 'auto';

  @HostBinding('style.max-width')
  maxWidth = '80%';

  @HostBinding('style.text-align')
  textAlign = 'center';
}
