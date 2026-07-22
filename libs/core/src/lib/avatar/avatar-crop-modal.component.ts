import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalHeaderDirective,
  RwModalService,
} from '@renwu/components';

const OUTPUT_SIZE = 400;
const MAX_ZOOM_FACTOR = 4;

@Component({
  selector: 'renwu-avatar-crop-modal',
  standalone: true,
  imports: [
    RwModalComponent,
    RwModalHeaderDirective,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './avatar-crop-modal.component.html',
  styleUrl: './avatar-crop-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarCropModalComponent implements AfterViewInit {
  /** Assigned by `RwModalService.add` via `Object.assign`. */
  imageFile!: File;
  /** Assigned by `RwModalService.add` via `Object.assign`. */
  onCropped?: (file: File) => void;

  private modalService = inject(RwModalService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('viewport')
  viewport?: ElementRef<HTMLDivElement>;

  @ViewChild('imageEl')
  imageEl?: ElementRef<HTMLImageElement>;

  imageUrl = '';
  naturalWidth = 0;
  naturalHeight = 0;
  scale = 1;
  minScale = 1;
  offsetX = 0;
  offsetY = 0;
  dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private originOffsetX = 0;
  private originOffsetY = 0;
  ready = false;

  get maxScale(): number {
    return this.minScale * MAX_ZOOM_FACTOR;
  }

  /** 0–100 for the zoom slider. */
  get zoomPercent(): number {
    if (!this.ready || this.maxScale <= this.minScale) {
      return 0;
    }
    return (
      ((this.scale - this.minScale) / (this.maxScale - this.minScale)) * 100
    );
  }

  ngAfterViewInit(): void {
    this.imageUrl = URL.createObjectURL(this.imageFile);
    this.cd.markForCheck();
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.naturalWidth = img.naturalWidth;
    this.naturalHeight = img.naturalHeight;
    const viewportSize = this.getViewportSize();
    this.minScale = Math.max(
      viewportSize / this.naturalWidth,
      viewportSize / this.naturalHeight,
    );
    this.scale = this.minScale;
    this.offsetX = 0;
    this.offsetY = 0;
    this.ready = true;
    this.cd.markForCheck();
  }

  get imageStyle(): Record<string, string> {
    const viewportSize = this.getViewportSize();
    const width = this.naturalWidth * this.scale;
    const height = this.naturalHeight * this.scale;
    return {
      width: `${width}px`,
      height: `${height}px`,
      left: `${(viewportSize - width) / 2 + this.offsetX}px`,
      top: `${(viewportSize - height) / 2 + this.offsetY}px`,
    };
  }

  onZoomInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.setZoomPercent(value);
  }

  setZoomPercent(percent: number): void {
    if (!this.ready) {
      return;
    }
    const t = Math.min(100, Math.max(0, percent)) / 100;
    this.scale = this.minScale + t * (this.maxScale - this.minScale);
    this.clampOffsets();
    this.cd.markForCheck();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -3 : 3;
    this.setZoomPercent(this.zoomPercent + delta);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.ready) {
      return;
    }
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.originOffsetX = this.offsetX;
    this.originOffsetY = this.offsetY;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.offsetX = this.originOffsetX + (event.clientX - this.dragStartX);
    this.offsetY = this.originOffsetY + (event.clientY - this.dragStartY);
    this.clampOffsets();
    this.cd.markForCheck();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  async apply(): Promise<void> {
    if (!this.ready || !this.imageEl) {
      return;
    }
    const viewportSize = this.getViewportSize();
    const displayedWidth = this.naturalWidth * this.scale;
    const displayedHeight = this.naturalHeight * this.scale;
    const left = (viewportSize - displayedWidth) / 2 + this.offsetX;
    const top = (viewportSize - displayedHeight) / 2 + this.offsetY;
    const sx = Math.max(0, -left / this.scale);
    const sy = Math.max(0, -top / this.scale);
    const sSize = viewportSize / this.scale;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(
      this.imageEl.nativeElement,
      sx,
      sy,
      sSize,
      sSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) {
      return;
    }
    const file = new File([blob], 'avatar.png', { type: 'image/png' });
    this.onCropped?.(file);
    this.close();
  }

  close(): void {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = '';
    }
    this.modalService.close();
  }

  private getViewportSize(): number {
    return this.viewport?.nativeElement.clientWidth || 280;
  }

  private clampOffsets(): void {
    const viewportSize = this.getViewportSize();
    const displayedWidth = this.naturalWidth * this.scale;
    const displayedHeight = this.naturalHeight * this.scale;
    const maxX = Math.max(0, (displayedWidth - viewportSize) / 2);
    const maxY = Math.max(0, (displayedHeight - viewportSize) / 2);
    this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
    this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
  }
}
