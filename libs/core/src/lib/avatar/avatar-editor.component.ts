import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwModalService,
  RwToastService,
  RwTooltipDirective,
} from '@renwu/components';
import { filter, firstValueFrom, take } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { User } from '../user/user.model';
import { RwUserService } from '../user/user.service';
import { AvatarCropModalComponent } from './avatar-crop-modal.component';
import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'renwu-avatar-editor',
  standalone: true,
  imports: [
    AvatarComponent,
    RwButtonComponent,
    RwTooltipDirective,
    TranslocoPipe,
  ],
  templateUrl: './avatar-editor.component.html',
  styleUrl: './avatar-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarEditorComponent implements OnDestroy {
  private modalService = inject(RwModalService);
  private dataService = inject(RwDataService);
  private userService = inject(RwUserService);
  private toastService = inject(RwToastService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  @Input() user: User | null = null;
  @Input() size = '9em';
  @Input() previewText: string | null | undefined;
  @Input() previewColor: string | null | undefined;

  draftFile: File | null = null;
  draftPreviewUrl: string | null = null;
  removed = false;

  get hasAvatarImage(): boolean {
    return !this.removed && (!!this.draftPreviewUrl || !!this.user?.avatar_id);
  }

  get canRemove(): boolean {
    return this.hasAvatarImage;
  }

  /** `undefined` — user avatar; `''` — no image after remove. */
  get imageUrl(): string | undefined {
    if (this.draftPreviewUrl) {
      return this.draftPreviewUrl;
    }
    if (this.removed) {
      return '';
    }
    return undefined;
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Only image files are allowed');
      return;
    }
    this.modalService.add(AvatarCropModalComponent, {
      imageFile: file,
      onCropped: (cropped: File) => this.setDraft(cropped),
    });
  }

  removeAvatar(): void {
    this.clearDraftPreview();
    this.draftFile = null;
    this.removed = true;
    this.cd.markForCheck();
  }

  async applyDraft(): Promise<void> {
    if (!this.user?.id) {
      return;
    }
    if (this.draftFile) {
      await firstValueFrom(
        this.dataService
          .postAttachmentUploadAvatar({
            file: this.draftFile,
            fileName: this.draftFile.name,
          })
          .pipe(
            filter((result) => !!result?.__loaded),
            take(1),
          ),
      );
      await firstValueFrom(this.userService.updateUser(this.user.id));
      this.clearDraftPreview();
      this.draftFile = null;
      this.removed = false;
      this.cd.markForCheck();
      return;
    }
    if (this.removed) {
      await firstValueFrom(this.userService.deleteAvatar(this.user.id));
      this.removed = false;
      this.cd.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.clearDraftPreview();
  }

  private setDraft(file: File): void {
    this.clearDraftPreview();
    this.draftFile = file;
    this.draftPreviewUrl = URL.createObjectURL(file);
    this.removed = false;
    this.cd.markForCheck();
  }

  private clearDraftPreview(): void {
    if (this.draftPreviewUrl) {
      URL.revokeObjectURL(this.draftPreviewUrl);
      this.draftPreviewUrl = null;
    }
  }
}
