import {
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { RwModalService } from '../modal.service';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { RwButtonComponent } from '../../button/button.component';
import {
  RwShortcutService,
  ShortcutObservable,
} from '../../shortcut/shortcut.service';

@Component({
  selector: 'rw-modal',
  standalone: true,
  imports: [RwButtonComponent],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  encapsulation: ViewEncapsulation.None,
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
        'create',
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
      state(
        'close',
        style({
          opacity: 0,
          transform: 'translateY(0) scale(0.95)',
        }),
      ),
      transition('void => create', animate('0ms')),
      transition('void => show', animate('150ms 75ms ease-out')),
      transition('create => show', animate('150ms 75ms ease-out')),
      transition('show => close', animate('150ms ease-out')),
    ]),
    trigger('backgroundState', [
      state(
        'void',
        style({
          opacity: 0,
        }),
      ),
      state(
        'create',
        style({
          opacity: 1,
        }),
      ),
      state(
        'show',
        style({
          opacity: 1,
        }),
      ),
      state(
        'close',
        style({
          opacity: 0,
        }),
      ),
      transition('void => create', animate('150ms ease-out')),
      transition('void => show', animate('150ms ease-out')),
      transition('create => show', animate('0ms')),
      transition('show => close', animate('150ms 75ms ease-out')),
    ]),
  ],
})
export class RwModalComponent implements OnInit, OnDestroy {
  set state(value: string) {
    this.__state = value;
    this.cd.detectChanges();
  }
  get state(): string {
    return this.__state;
  }

  __state = 'create';

  shortcut: ShortcutObservable;

  @Output()
  closed = new EventEmitter<boolean>();

  constructor(
    public modalService: RwModalService,
    private shortcutService: RwShortcutService,
    private cd: ChangeDetectorRef,
    private el: ElementRef,
  ) {
    this.shortcut = this.shortcutService.subscribe('Escape', () => {
      this.close();
    });
  }

  ngOnInit(): void {
    this.modalService.registerModal(this);
  }

  ngOnDestroy(): void {
    this.shortcut.unsubscribe();
    this.closed.complete();
  }

  close(): void {
    this.modalService.close(this);
    this.state = 'close';
    this.cd.detectChanges();
    globalThis.setTimeout(() => {
      this.closed.next(true);
    }, 200);
  }
}

@Directive({
  selector: '[rwModalHeader]',
  standalone: true,
})
export class RwModalHeaderDirective {}

@Directive({
  selector: '[rwModalSubHeader]',
  standalone: true,
})
export class RwModalSubHeaderDirective {}

@Directive({
  selector: '[rwModalHeaderButtons]',
  standalone: true,
})
export class RwModalHeaderButtonsDirective {}

@Directive({
  selector: '[rwModalClose]',
  standalone: true,
})
export class RwModalCloseDirective {}

@Directive({
  selector: '[rwModalBody]',
  standalone: true,
})
export class RwModalBodyDirective {}

@Directive({
  selector: '[rwModalFooter]',
  standalone: true,
})
export class RwModalFooterDirective {}
