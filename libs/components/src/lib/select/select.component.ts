import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EnvironmentInjector,
  EventEmitter,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Placement } from '@floating-ui/dom';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subject, firstValueFrom } from 'rxjs';
import { RwButtonComponent } from '../button/button.component';
import { RwDropDownComponent } from '../dropdown/dropdown.component';
import { RwIconComponent } from '../icon/icon.component';
import { IconName } from '../icon/list';
import { RwPreventParentScrollDirective } from '../prevent-parent-scroll/prevent-parent-scroll.directive';
import { ISelectItem, ISelectModel, SelectModelBase } from './select.model';
import {
  RW_SELECT_ICON_DOWN,
  RW_SELECT_ICON_UP,
  RW_SELECT_MODELS,
} from './select.token';

const noop = (): void => {
  return;
};

@Component({
  selector: 'rw-select',
  standalone: true,
  imports: [
    RwPreventParentScrollDirective,
    RwDropDownComponent,
    RwButtonComponent,
    RwIconComponent,
    AsyncPipe,
    NgTemplateOutlet,
    FormsModule,
    TranslocoPipe,
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RwSelectComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwSelectComponent implements OnDestroy, ControlValueAccessor {
  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: unknown) => void = noop;

  private lastWriteValue: unknown;

  loading: boolean;

  thisContext: { select: RwSelectComponent };

  selectedIndex = 0;

  searchString: string;

  modelChanged: Subject<boolean> = new Subject();

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @Input()
  set model(value: ISelectModel<any>) {
    if (value) {
      this.modelChanged.next(true);
      this._model = value;
      // this.model.selected
      //   .pipe(takeUntil(this.modelChanged))
      //   .subscribe(() => void this.applyChanges());
    }
  }
  get model(): ISelectModel<unknown> {
    return this._model;
  }
  _model: ISelectModel<unknown> = new SelectModelBase();

  @Input()
  set modelName(value: string) {
    this._modelName = value;
    if (!this.models[value]) {
      throw `Can't find model ${value} in model providers`;
    }
    this.model = this.injector.runInContext(this.models[value]);
    // this.model.prompt = this._prompt;
  }
  get modelName(): string {
    return this._modelName;
  }
  _modelName: string;

  @Input()
  iconClosed: IconName;

  @Input()
  iconOpened: IconName;

  @ViewChild('dropdown')
  dropdown: RwDropDownComponent;

  @ViewChild('input')
  input: ElementRef;

  @Input()
  @HostBinding()
  tabindex = 0;

  @HostBinding('class.rw-select-active')
  opened: boolean;

  @Input()
  @HostBinding('class.borderless')
  borderless = false;

  @Output()
  closed = new EventEmitter<void>();

  @Output()
  changed = new EventEmitter<ISelectItem<unknown>[]>();

  @Input()
  set openByClick(value: boolean) {
    if (value) {
      this.switchPopup(true);
    }
  }

  @Input()
  tags: boolean;

  @Input()
  manyLayout = 'horizontal';

  @Input()
  disabled: boolean;

  @Input()
  prompt: string;

  @Input()
  closeOnSelect = true;

  @Input()
  live = false;

  @Input()
  set emptyItem(item: ISelectItem<unknown>) {
    this.model.emptyItem.next(item);
  }

  @Input()
  centred = false;

  @Input()
  dropdownPlacement: Placement = 'bottom-start';

  @Input()
  dropdownInside = true;

  @ContentChild('selectedItemTemplateDefault', { static: true })
  selectedItemTemplateDefault: TemplateRef<unknown>;

  @ContentChild('selectedItemActionsDefault', { static: true })
  selectedItemActionsDefault: TemplateRef<unknown>;

  @ContentChild('selectedItemActions', { static: true })
  selectedItemActions: TemplateRef<unknown>;

  @ContentChild('selectedItemTemplate', { static: true })
  selectedItemTemplate: TemplateRef<unknown>;

  @ContentChild('lastItemTemplate', { static: true })
  lastItemTemplate: TemplateRef<unknown>;

  @ContentChild('firstItemTemplate', { static: true })
  firstItemTemplate: TemplateRef<unknown>;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.opened) {
      if (event.key === 'Space' || event.key === 'Enter') {
        this.switchPopup(true);
      }
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      return;
    }
  }

  constructor(
    private injector: EnvironmentInjector,
    protected el: ElementRef,
    @Optional()
    @Inject(RW_SELECT_ICON_DOWN)
    selectIconDown: IconName,
    @Optional()
    @Inject(RW_SELECT_ICON_UP)
    selectIconUp: IconName,
    @Inject(RW_SELECT_MODELS)
    private models: Record<string, () => ISelectModel<unknown>>,
    private cd: ChangeDetectorRef,
  ) {
    this.thisContext = { select: this };
    this.iconClosed = selectIconDown || 'keyboard_arrow_down';
    this.iconOpened = selectIconUp || 'keyboard_arrow_up';
  }

  writeValue(value: unknown): void {
    this.lastWriteValue = value;
    this.model.setData(value);
  }

  registerOnChange(fn: (_: unknown) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  async applyChanges(): Promise<void> {
    this.lastWriteValue = this.model.getData();
    this.onChangeCallback(this.model.getData());
    this.changed.next(await this.model.selected.getValue());
  }

  ngOnDestroy(): void {
    this.dropdown = null;
    // this.close.complete();
    // this.close = null;
    this.cd.markForCheck();
  }

  switchPopup(value?: boolean): void {
    if (this.disabled) {
      return;
    }
    if (value === undefined) {
      value = !this.opened;
    }
    if (value === this.opened) {
      return;
    }
    if (!value) {
      this.opened = value;
      this.dropdown.hide();
      this.closed.next();
      void this.applyChanges();
      this.returnFocus();
    } else {
      this.model.setData(this.lastWriteValue);
      this.model.show();
      this.opened = value;
      this.dropdown.show();
      this.focusOnInput();
    }
    this.cd.markForCheck();
  }
  setIndex(value: number): void {
    this.selectedIndex = value;
  }
  async onSearchKeyDown(event: KeyboardEvent): Promise<void> {
    const optionsList = (
      this.dropdown.el.nativeElement as HTMLElement
    ).getElementsByClassName('options')[0] as HTMLElement;
    const activeOption = (
      this.dropdown.el.nativeElement as HTMLElement
    ).getElementsByClassName('option cursor')[0] as HTMLElement;
    const searchElement = (
      this.dropdown.el.nativeElement as HTMLElement
    ).getElementsByClassName('search')[0] as HTMLElement;

    if (event.key === 'Enter') {
      this.model.select(this.selectedIndex);
      event.preventDefault();
      if (this.closeOnSelect && !this.model.many) {
        this.switchPopup(false);
      }
      if (this.model.createNewOption) {
        this.searchString = '';
        this.model.search('');
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.switchPopup(false);
      return;
    }
    if (event.key === 'ArrowUp') {
      if (this.tags) {
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
      } else {
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      }
      event.preventDefault();
    }
    if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        (await firstValueFrom(this.model.list)).length - 1,
      );
      event.preventDefault();
    }
    if (activeOption && optionsList) {
      const activeOptionRect = activeOption.getBoundingClientRect();
      const optionsListRect = optionsList.getBoundingClientRect();
      const searchHeight = searchElement ? searchElement.offsetHeight : 0;
      optionsList.scrollTop =
        activeOptionRect.top -
        optionsListRect.top -
        searchHeight +
        optionsList.scrollTop;
    }
  }
  onPopupScroll(event: Event): void {
    event.stopImmediatePropagation();
  }
  onRemoveItem(event: MouseEvent, index: number): void {
    this.model.unselect(index);
    event.stopImmediatePropagation();
    event.preventDefault();
  }
  onSelect(index: number): void {
    this.model.select(index);
    if (this.closeOnSelect) {
      this.switchPopup(false);
    }
  }
  dropdownDisplayed(): void {
    this.focusOnInput();
  }
  focusOnInput(): void {
    globalThis.setTimeout(() => {
      if (this.input) {
        (this.input.nativeElement as HTMLElement).focus();
      }
    }, 300);
  }
  returnFocus(): void {
    (this.el.nativeElement as HTMLElement).focus();
  }
  onLoadMore(): void {
    this.model.currentPage++;
    this.model.loadPage(this.model.currentPage);
  }
}
