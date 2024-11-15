import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { RwButtonComponent } from '../button/button.component';
import { RwTextInputComponent } from '../text-input/text-input.component';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-pager',
  standalone: true,
  imports: [
    RwButtonComponent,
    RwTextInputComponent,
    FormsModule,
    TranslocoPipe,
  ],
  templateUrl: './pager.component.html',
  styleUrl: './pager.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwPagerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwPagerComponent implements ControlValueAccessor {
  private _rowsNumber = 0;

  private _pageSize = 20;

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Input()
  set currentPage(value: number) {
    this._currentPage = Number(value);
    this.onChangeCallback(value);
  }
  get currentPage(): number {
    return this._currentPage;
  }

  _currentPage = 0;

  pageCount = 0;

  @Input()
  public set rowsCount(count: number) {
    this._rowsNumber = count;
    this.updatePageCount();
  }

  public get rowsCount(): number {
    return this._rowsNumber;
  }

  @Input()
  showPageTextInput: boolean;

  @Input()
  showJumpToEnd: boolean;

  @Input()
  showPages: boolean;

  @Input()
  pagesCountLimit = 5;

  @Output()
  pageChanged = new EventEmitter<number>();

  @Input()
  public set pageSize(size: number) {
    if (!size) {
      size = 1;
    }

    this.currentPage = 0;
    this._pageSize = size;
    this.updatePageCount();
  }

  public get pageSize(): number {
    return this._pageSize;
  }

  pages: { label: string; page: number }[] = [];

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: number) => void = noop;

  constructor(private cd: ChangeDetectorRef) {}

  registerOnChange(fn: (_: number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  writeValue(value: number): void {
    if (value) {
      this.currentPage = Number(value) + 1;
    } else {
      this.currentPage = 1;
    }
    this.cd.markForCheck();
  }

  private updatePageCount(): void {
    this.pageCount = Math.ceil(this.rowsCount / this.pageSize);

    if (this.pageCount > this.pagesCountLimit + 2) {
      this.pages = new Array(this.pagesCountLimit).fill('').map((v, i) => ({
        label: (i + 1).toString(),
        page: i,
      }));
      this.pages.push({ label: '...', page: null });
      this.pages.push({
        label: this.pageCount.toString(),
        page: this.pageCount - 1,
      });
    } else {
      this.pages = new Array(this.pageCount).fill('').map((v, i) => ({
        label: (i + 1).toString(),
        page: i,
      }));
    }
    this.cd.markForCheck();
  }

  private currentPageChanged(): void {
    this.onChangeCallback(this.currentPage);
    this.pageChanged.next(this.currentPage);
    this.cd.markForCheck();
  }

  public onClickFirst(): void {
    this.currentPage = 0;
    this.currentPageChanged();
  }

  public onClickPrev(): void {
    if (this.currentPage > 0) {
      this.currentPage = this.currentPage - 1;
      this.currentPageChanged();
    }
  }

  public onClickLast(): void {
    this.currentPage = this.pageCount - 1;
    this.currentPageChanged();
  }

  public onClickNext(): void {
    if (this.currentPage < this.pageCount - 1) {
      this.currentPage = this.currentPage + 1;
      this.currentPageChanged();
    }
  }
  gotoPage(page: number | null) {
    if (page !== null) {
      this.currentPage = page;
      this.currentPageChanged();
    }
  }
}
