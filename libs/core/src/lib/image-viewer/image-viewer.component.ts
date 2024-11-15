
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { RwIconComponent } from '@renwu/components';

import { TranslocoPipe } from '@ngneat/transloco';
import { Attachment } from '../issue/issue.model';

interface PreparedAttachment extends Attachment {
  href: string;
  href_file_name: string;
}

@Component({
  selector: 'renwu-image-viewer',
  standalone: true,
  imports: [RwIconComponent, TranslocoPipe],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
})
export class ImageViewerComponent implements OnInit {
  @Input()
  image: PreparedAttachment;

  @Input()
  set images(value: PreparedAttachment[]) {
    this.__images = value;
    if (
      this.currentIndex !== null &&
      this.imageViewer &&
      ((this.__images[this.currentIndex] &&
        this.imageViewer.id !== this.__images[this.currentIndex].id) ||
        !this.__images[this.currentIndex])
    ) {
      const len = this.__images.length;
      if (this.currentIndex < len) {
        this.imageViewer = this.__images[this.currentIndex];
      } else if (this.currentIndex > 0 && this.currentIndex === len) {
        this.prevImage();
      } else {
        this.closeViewer();
      }
    }
  }
  get images(): PreparedAttachment[] {
    return this.__images;
  }
  __images: PreparedAttachment[];

  @Output()
  deleteImage = new EventEmitter<PreparedAttachment>();

  @ViewChild('img', { static: true })
  img: ElementRef;

  broken: boolean;
  disableZoom: boolean;

  @Input()
  currentIndex = 0;

  @Output()
  closed = new EventEmitter();

  imageViewer: PreparedAttachment;

  zoomed: boolean;
  inited: boolean;

  configScroll = {
    suppressScrollX: false,
    suppressScrollY: false,
  };

  @HostListener('window:keyup', ['$event'])
  onKeyUpWindow(eventKeyboard: KeyboardEvent): void {
    if (eventKeyboard.key === 'Escape') {
      this.closeViewer();
      this.disableEvent(eventKeyboard);
      return;
    } else if (eventKeyboard.key === 'ArrowRight') {
      this.nextImage();
      this.disableEvent(eventKeyboard);
      return;
    } else if (eventKeyboard.key === 'ArrowLeft') {
      this.prevImage();
      this.disableEvent(eventKeyboard);
      return;
    } else if (
      eventKeyboard.key === 'ArrowUp' ||
      eventKeyboard.key === 'ArrowDown'
    ) {
      this.disableEvent(eventKeyboard);
      return;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDownWindow(eventKeyboard: KeyboardEvent): void {
    if (eventKeyboard.key === 'Escape') {
      this.disableEvent(eventKeyboard);
      return;
    } else if (eventKeyboard.key === 'ArrowRight') {
      this.disableEvent(eventKeyboard);
      return;
    } else if (eventKeyboard.key === 'ArrowLeft') {
      this.disableEvent(eventKeyboard);
      return;
    } else if (
      eventKeyboard.key === 'ArrowUp' ||
      eventKeyboard.key === 'ArrowDown'
    ) {
      this.disableEvent(eventKeyboard);
      return;
    }
  }

  constructor() {
    this.imageViewer = null;
  }

  ngOnInit(): void {
    this.displayImage();
  }
  onLoad(): void {
    this.imageViewer = this.images[this.currentIndex];
    const element: HTMLImageElement = this.img
      .nativeElement as HTMLImageElement;
    this.disableZoom =
      element.width === element.naturalWidth &&
      element.height === element.naturalHeight;
    if (this.disableZoom) {
      this.zoomed = false;
    }
    this.broken = false;
  }

  onError(): void {
    this.broken = true;
    this.disableZoom = true;
  }
  disableEvent(eventKeyboard: KeyboardEvent): void {
    eventKeyboard.preventDefault();
    eventKeyboard.stopImmediatePropagation();
  }
  closeViewer(): void {
    //   this.modalService.close();
  }
  displayImage(): void {
    this.broken = true;
    this.disableZoom = true;
    setTimeout(() => {
      if (this.images && this.images[this.currentIndex]) {
        this.imageViewer = this.images[this.currentIndex];
      }
    });
  }
  imageClick(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    const bounds = target.parentElement.parentElement.getBoundingClientRect();
    const activeElementWidth = bounds.width / 3;
    if (this.images.length === 1) {
      this.switchZoom();
    } else {
      if (
        event.clientX > bounds.left &&
        event.clientX < bounds.left + activeElementWidth
      ) {
        this.prevImage();
      } else if (
        event.clientX < bounds.right &&
        event.clientX > bounds.right - activeElementWidth
      ) {
        this.nextImage();
      } else {
        this.switchZoom();
      }
    }
  }
  nextImage(): void {
    if (this.images.length === 1) {
      return;
    }
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.displayImage();
    // setTimeout(() => {
    //   this.scroller.directiveRef.update();
    // });
  }
  prevImage(): void {
    if (this.images.length === 1) {
      return;
    }
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.images.length - 1;
    }
    this.displayImage();
    // setTimeout(() => {
    //   this.scroller.directiveRef.update();
    // });
  }
  switchZoom(): void {
    if (this.disableZoom) {
      return;
    }
    this.zoomed = !this.zoomed;
    // if (!this.zoomed) {
    //   this.scroller.directiveRef.scrollTo(0, 0);
    // }
    // setTimeout(() => {
    //   this.scroller.directiveRef.update();
    // });
  }
  onDeleteImage(): void {
    this.deleteImage.next(this.imageViewer);
  }
}
