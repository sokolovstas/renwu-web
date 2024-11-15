import {
  Component,
  HostBinding,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'rw-tooltip',
  standalone: true,
  templateUrl: 'tooltip.component.html',
  styleUrl: './tooltip.component.scss',
  animations: [
    trigger('state', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(0) scale(0.95)',
        }),
      ),
      state(
        'show',
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        }),
      ),
      transition('void => show', animate('150ms linear')),
      transition('show => void', animate('150ms linear')),
    ]),
  ],
})
export class RwTooltipComponent {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  target: ViewContainerRef;

  @Input()
  text: string;

  @Input()
  @HostBinding('class.hide-back')
  hideBack: boolean;

  @HostBinding('@state')
  state: 'show' | 'hide' = 'show';

  @HostBinding('style.white-space')
  whitespace: string;

  @HostBinding('style.width')
  width = 'auto';

  @HostBinding('style.max-width')
  maxWidth = '80%';

  @HostBinding('style.text-align')
  textAlign = 'center';
}
