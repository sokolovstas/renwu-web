import { ChangeDetectorRef, Component, Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation, inject } from '@angular/core';
import { RwModalService } from '../modal.service';

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
})
export class RwModalComponent implements OnInit, OnDestroy {
  modalService = inject(RwModalService);
  private shortcutService = inject(RwShortcutService);
  private cd = inject(ChangeDetectorRef);
  private el = inject(ElementRef);

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

  constructor() {
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
