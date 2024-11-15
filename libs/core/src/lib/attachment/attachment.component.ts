
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RwDatePipe, RwToastService } from '@renwu/components';

import { TranslocoPipe } from '@ngneat/transloco';
import { fromEvent } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { FileUpload, FileWithName } from '../data/upload';
import { RW_CORE_SETTINGS, RwCoreSettings } from '../settings-token';

@Component({
  selector: 'renwu-attachment',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './attachment.component.html',
  styleUrl: './attachment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentComponent implements OnInit {
  destroy = inject(DestroyRef);

  flagFileDrop = false;
  num: number;
  filesDrop = new Array<FileWithName>();
  mapAttachments: Record<string, FileUpload> = {};
  countNotSendAll = 0;

  @Input()
  addFileHandler: (data: FileUpload) => void;
  @Input()
  flagButton = false;
  @Input()
  flagDropZone = false;
  @Input()
  flagPaste = false;
  @Input()
  classButton: string;
  @Input()
  flagAvatar: boolean;
  @Input()
  padding: string;
  @Input()
  fontSize: string;
  @Output()
  fileOver = new EventEmitter<boolean>();
  @Output()
  filesUploaded = new EventEmitter<void>();
  @Output()
  fileUploaded = new EventEmitter<FileUpload>();
  @Output()
  filesSendStart = new EventEmitter<void>();

  IMAGE_MIME_REGEX = new RegExp('^image/(p?jpe?g|gif|png|bmp)$', 'i');
  dragLeaveTimeout: number;

  constructor(
    private dataService: RwDataService,
    private toastService: RwToastService,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    @Inject(RW_CORE_SETTINGS) private settings: RwCoreSettings,
  ) {
    this.num = Math.round(Math.random() * 100000);
  }
  ngOnInit(): void {
    fromEvent<DragEvent>(document, 'dragover')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((event: DragEvent) => {
        if (!this.flagDropZone) {
          return;
        }
        clearTimeout(this.dragLeaveTimeout);
        if (event.clientX === 0 || event.clientY === 0) {
          return;
        }
        const transfer = event.dataTransfer;
        if (!this._haveFiles([...transfer.types])) {
          return;
        }
        this.flagFileDrop = true;
        transfer.dropEffect = 'copy';
        transfer.effectAllowed = 'copyLink';
        event.preventDefault();
        this.fileOver.next(true);
        this.cd.markForCheck();
      });
    fromEvent<DragEvent>(document, 'dragover')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((event: MouseEvent) => {
        if (!this.flagDropZone) {
          return;
        }
        clearTimeout(this.dragLeaveTimeout);
        if ((event.clientX > 0 || event.clientY > 0) && this.flagFileDrop) {
          this.dragLeaveTimeout = globalThis.setTimeout(() => {
            this.disableDropZone(event);
          }, 300);
          return;
        }
        this.disableDropZone(event);
      });
    fromEvent<DragEvent>(document, 'drop')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((event: DragEvent) => {
        if (!this.flagDropZone) {
          return;
        }
        clearTimeout(this.dragLeaveTimeout);
        // const transfer = this._getTransfer(event);
        this.disableDropZone(event);
      });
  }

  // CLIPBOARD PASTE FILE
  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.flagDropZone) {
      return;
    }
    const clipboard = event.clipboardData;
    if (clipboard) {
      const types = clipboard.types;
      const items = clipboard.items;

      for (let i = 0; i < types.length; i++) {
        if (
          window['FileReader'] &&
          items &&
          this.IMAGE_MIME_REGEX.test(items[i].type)
        ) {
          this.filesDrop.push({
            file: clipboard.items[i].getAsFile(),
            fileName: `Pasted image at ${RwDatePipe.t(new Date())}.png`,
          });
          this.countNotSendAll++;
        }
      }
      if (this.filesDrop.length > 0) {
        this.filesSendStart.next();
        this.sendFile();
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }
  }
  @HostListener('drop', ['$event'])
  public onDrop(event: DragEvent): void {
    const transfer = event.dataTransfer;
    if (!transfer) {
      return;
    }
    this.disableDropZone(event);
    this.onFileDrop(transfer.files);
  }
  clearAttachmentFiles(): void {
    (<HTMLInputElement>(
      document.getElementById('attachment-files-' + String(this.num))
    )).value = null;
  }
  disableDropZone(event: Event): void {
    this.flagFileDrop = false;
    event.preventDefault();
    this.fileOver.next(false);
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  sendFile(): void {
    if (!this.filesDrop || this.filesDrop.length === 0) {
      return;
    }
    const index = Math.round(Math.random() * 10000000);
    const file = this.filesDrop.pop();
    const testCompleted = () => {
      if (this.filesDrop.length > 0) {
        this.sendFile();
      } else {
        if (this.countNotSendAll === 0) {
          setTimeout(() => {
            this.clearAttachmentFiles();
            this.filesUploaded.next();
          }, 100);
        }
      }
    };
    const loadHandler = (data: FileUpload) => {
      const fileName = `${data.file_name}${index}`;
      if (!this.mapAttachments[fileName]) {
        this.mapAttachments[fileName] = data;
        if (this.addFileHandler) {
          this.addFileHandler(data);
        }
      } else {
        this.mapAttachments[fileName] = {
          ...this.mapAttachments[fileName],
          ...data,
        };
      }
      if (data.__loaded) {
        this.fileUploaded.next(data);
        this.countNotSendAll--;
      }
      testCompleted();
    };
    const errorHandler = (data: FileUpload) => {
      this.toastService.error(
        `File ${data.file_name} sending failed with error !`,
      );
      this.countNotSendAll--;
      testCompleted();
    };
    if (file.file.size > this.settings.maxSizeAttachment) {
      this.toastService.error(
        `Fize size ${file.fileName} exceeds the maximum size ${Math.round(
          this.settings.maxSizeAttachment / 1024 / 1024,
        )}mb!`,
      );
      this.countNotSendAll--;
      testCompleted();
    } else if (this.flagAvatar) {
      this.dataService.postAttachmentUploadAvatar(file).subscribe(
        (data) => {
          loadHandler(data);
        },
        (data: unknown) => {
          errorHandler(data as FileUpload);
        },
      );
    } else {
      this.dataService.postAttachmentUploadIssue(file).subscribe(
        (data) => {
          loadHandler(data);
        },
        (data: unknown) => {
          errorHandler(data as FileUpload);
        },
      );
    }
  }
  onFileDrop(files: FileList): void {
    const arrayFiles = Array.from(files).map((f) => ({
      file: f,
      fileName: f.name,
    }));
    this.filesDrop = this.filesDrop.concat(arrayFiles);
    this.countNotSendAll += arrayFiles.length;
    this.filesSendStart.next();
    this.sendFile();
  }

  private _haveFiles(types: string[]): boolean {
    if (!types) {
      return false;
    }

    return types.indexOf('Files') !== -1;
  }
  getFiles(eventFile: Event): void {
    this.onFileDrop((eventFile.target as HTMLInputElement).files);
  }
}
