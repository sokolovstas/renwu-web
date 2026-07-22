import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RwIconComponent, RwTooltipDirective } from '@renwu/components';
import { Color } from '@renwu/utils';
import { User } from '../user/user.model';
import { RwUserService } from '../user/user.service';

/** Shared canvas context for measuring initials text width. */
let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
}

@Component({
  selector: 'renwu-avatar',
  standalone: true,
  imports: [RwTooltipDirective, RwIconComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnInit, OnDestroy {
  userService = inject(RwUserService);
  private cd = inject(ChangeDetectorRef);

  destroy = inject(DestroyRef);

  @ViewChild('avatarEl')
  avatarEl?: ElementRef<HTMLElement>;

  @Input()
  set user(value: User | null) {
    this.__user = value;
    this.update();
  }
  get user(): User | null {
    return this.__user;
  }
  __user: User | null;

  @Input()
  set userId(value: string) {
    this.__user = this.userService.getUser(value);
    this.update();
  }

  @Input()
  showOnline = true;

  @Input()
  showTooltip = true;

  @Input()
  forceInitials = false;

  /** `undefined` — user avatar; `''` — no image (initials). */
  @Input()
  set imageUrl(value: string | undefined) {
    this._imageUrl = value;
    this.update();
  }
  get imageUrl(): string | undefined {
    return this._imageUrl;
  }
  private _imageUrl: string | undefined;

  @Input()
  @HostBinding('class.editable')
  editable = false;

  @Output()
  editClick = new EventEmitter<void>();

  @Input()
  set size(value: string) {
    this._size = value;
    this.update();
  }
  get size(): string {
    return this._size;
  }
  _size = '30px';

  @Input()
  newUser: boolean;

  @Input()
  set previewText(value: string | null | undefined) {
    this._previewText = value;
    this.update();
  }
  private _previewText: string | null | undefined;

  @Input()
  set previewColor(value: string | null | undefined) {
    this._previewColor = value;
    this.update();
  }
  private _previewColor: string | null | undefined;

  fontSize = '13px';

  error: boolean;

  avatarUrl: string;
  @Input()
  initials = '-';
  online: boolean;
  @Input()
  color = '#eee';
  name: string;

  textColor = 'var(--always-black)';

  private fitFrame = 0;

  ngOnInit(): void {
    this.userService.userList
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.update();
      });
    this.userService.onlineMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        this.online = this.getOnline();
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.fitFrame) {
      cancelAnimationFrame(this.fitFrame);
    }
    this.user = null;
  }

  onAvatarClick(): void {
    if (!this.editable) {
      return;
    }
    this.editClick.emit();
  }

  update(): void {
    if (!this.user?.id && this.user?.username) {
      const user = this.userService.getUserByUsername(this.user.username);
      if (user) {
        this.user.id = user.id;
      }
    }
    const nextUrl = this.getUrl();
    if (nextUrl !== this.avatarUrl) {
      this.error = false;
    }
    this.avatarUrl = nextUrl;
    this.initials = this.getInitials();
    this.color = this.getColor();
    this.textColor = new Color(this.color).getTextColor(
      'var(--always-white)',
      'var(--always-black)',
    );
    this.name = this.getName();
    this.scheduleFitFontSize();

    this.cd.markForCheck();
  }

  getUrl(): string {
    if (this._imageUrl !== undefined) {
      return this._imageUrl || undefined;
    }
    if (this.forceInitials) {
      return undefined;
    }
    if (!this.newUser && this.user && this.user.id) {
      return this.userService.getAvatar(this.user.id);
    }
    return undefined;
  }

  getInitials(): string {
    if (typeof this._previewText === 'string') {
      return this._previewText || '-';
    }
    if (this.user) {
      if (typeof this.user.initials_text === 'string') {
        return this.user.initials_text || '-';
      }
      if (this.user.id) {
        return this.userService.getInitials(this.user) || '-';
      }
    }
    return this.initials || '-';
  }

  getOnline(): boolean {
    if (this.user && this.user.id) {
      return this.userService.getIsOnline(this.user.id);
    }
    return false;
  }

  getColor(): string {
    if (this._previewColor) {
      return this._previewColor;
    }
    if (this.user) {
      const fromUser = this.user.initials_color;
      if (fromUser) {
        return fromUser;
      }
      if (this.user.id) {
        return this.userService.getInitialsColor(this.user);
      }
    }
    return this.color;
  }
  getName(): string {
    if (this.user && this.user.id) {
      let fullName = this.userService.getFullName(this.user);
      fullName = fullName.replace(' ', '&nbsp;');
      return `${fullName} (${this.userService.getUsername(this.user)})`;
    } else {
      return '';
    }
  }

  private scheduleFitFontSize(): void {
    if (this.fitFrame) {
      cancelAnimationFrame(this.fitFrame);
    }
    this.fitFrame = requestAnimationFrame(() => {
      this.fitFrame = 0;
      this.fitFontSize();
    });
  }

  private fitFontSize(): void {
    if (!this.initials || this.avatarUrl) {
      return;
    }
    const diameter =
      this.avatarEl?.nativeElement.clientWidth ||
      this.parseSizeToPx(this.size);
    if (!diameter) {
      return;
    }

    // Keep padding from the circle edge so glyphs aren't clipped.
    const available = diameter * 0.68;
    const ctx = getMeasureContext();
    if (!ctx) {
      this.fontSize = `${available * 0.5}px`;
      this.cd.markForCheck();
      return;
    }

    const fontFamily =
      getComputedStyle(this.avatarEl?.nativeElement || document.body)
        .fontFamily || 'sans-serif';
    const fontWeight = '700';

    let lo = 4;
    let hi = available;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;
      const width = ctx.measureText(this.initials).width;
      const height = mid * 1.1;
      if (width <= available && height <= available) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    this.fontSize = `${Math.max(4, lo)}px`;
    this.cd.markForCheck();
  }

  private parseSizeToPx(size: string): number {
    const value = parseFloat(size);
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (size.endsWith('rem')) {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return value * (root || 16);
    }
    if (size.endsWith('em')) {
      const parent = this.avatarEl?.nativeElement.parentElement;
      const base = parent
        ? parseFloat(getComputedStyle(parent).fontSize)
        : 16;
      return value * (base || 16);
    }
    return value;
  }
}
