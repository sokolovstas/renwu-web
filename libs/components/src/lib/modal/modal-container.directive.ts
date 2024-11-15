import {
  ContentChild,
  Directive,
  HostBinding,
  Input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { RwModalService } from './modal.service';

@Directive({
  selector: '[rwModalContainer]',
  standalone: true,
})
export class RwModalContainerDirective implements OnInit {
  @HostBinding('class.rw-modalcontainer')
  classbind = true;

  @ContentChild('modalContainer', { read: ViewContainerRef, static: true })
  target: ViewContainerRef;

  @HostBinding('class.active')
  active: boolean;

  title: string;

  @Input()
  rwModalContainer: string;

  constructor(public modalService: RwModalService) {}

  ngOnInit(): void {
    this.modalService.registerContainer(
      this.rwModalContainer || 'default',
      this,
    );
  }

  close(): void {
    this.modalService.close();
  }
}
