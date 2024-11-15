import { BehaviorSubject, Subject } from 'rxjs';

import { ComponentRef, Injectable, Type } from '@angular/core';
import { RwModalContainerDirective } from './modal-container.directive';
import { RwModalComponent } from './modal/modal.component';

export class ModalWindow {
  data: Record<string, unknown>;
  contentRef: ComponentRef<unknown>;
  modal: RwModalComponent;
  wait: boolean;
  containerKey: string;

  constructor(
    component: ComponentRef<unknown>,
    data: Record<string, unknown>,
    wait: boolean,
    containerKey: string,
  ) {
    this.contentRef = component;
    this.data = data;
    this.wait = wait;
    this.containerKey = containerKey;
  }
}

export interface ModalContent {
  modalWait: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RwModalService {
  containers: Map<string, RwModalContainerDirective>;
  modals: ModalWindow[];
  removeStack: ModalWindow[];
  modalAdded: Subject<ModalWindow>;
  opened: BehaviorSubject<boolean>;

  constructor() {
    console.log(Math.random());
    this.modals = [];
    this.removeStack = [];
    this.modalAdded = new Subject();
    this.opened = new BehaviorSubject(false);
    this.containers = new Map<string, RwModalContainerDirective>();
  }
  registerContainer(key: string, container: RwModalContainerDirective): void {
    this.containers.set(key, container);
  }
  registerModal(modal: RwModalComponent): void {
    const lastModal = this.modals[this.modals.length - 1];
    if (!lastModal || lastModal.modal) {
      return;
    }
    lastModal.modal = modal;
    if (!lastModal.wait) {
      globalThis.setTimeout(() => {
        lastModal.modal.state = 'show';
      });
    }
  }
  // Add new modal and return instance of component
  add<T>(
    type: Type<T>,
    data: Record<string, unknown> = {},
    containerKey = 'default',
  ): T {
    const componentRef = this.containers
      .get(containerKey)
      .target.createComponent(type);

    const modal = new ModalWindow(
      componentRef,
      data,
      !!(componentRef.instance as ModalContent)['modalWait'],
      containerKey,
    );
    this.modals.push(modal);
    this.containers.get(containerKey).active = true;

    this.modalAdded.next(modal);

    const componentElement = componentRef.location;

    (componentElement.nativeElement as HTMLElement).parentElement.appendChild(
      componentElement.nativeElement,
    );

    Object.assign(componentRef.instance, data);

    this.opened.next(this.modals.length !== 0);

    return componentRef.instance;
  }
  show(): void {
    const lastModal = this.modals[this.modals.length - 1];
    if (!lastModal) {
      return;
    }
    lastModal.modal.state = 'show';
  }
  close(modal?: RwModalComponent): void {
    let lastModal: ModalWindow;
    if (modal) {
      lastModal = this.modals.find((m) => m.modal === modal);
    } else {
      lastModal = this.modals[this.modals.length - 1];
    }
    if (!lastModal) {
      return;
    }
    lastModal.modal.state = 'close';
    globalThis.setTimeout(() => {
      if (lastModal.contentRef) {
        lastModal.contentRef.destroy();
      }
      this.modals.splice(this.modals.indexOf(lastModal), 1);
      this.opened.next(this.modals.length !== 0);

      this.containers.get(lastModal.containerKey).active =
        this.modals.length > 0;
    }, 200);
  }
  closeAll(): void {
    while (this.modals.length > 0) {
      this.close(this.modals[this.modals.length - 1].modal);
    }
  }
}
