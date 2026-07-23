import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from 'prosemirror-commands';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} from 'prosemirror-markdown';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { RwButtonComponent } from '../button/button.component';

const noop = () => {
  return;
};

export const TEXTAREA_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RwTextAreaComponent),
  multi: true,
};

/** Markdown schema shared with messaging render path. */
export const mySchema = schema;

@Component({
  selector: 'rw-text-area',
  standalone: true,
  imports: [RwButtonComponent],
  templateUrl: './text-area.component.html',
  styleUrl: './text-area.component.scss',
  providers: [TEXTAREA_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RwTextAreaComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  el = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);

  @Input()
  @HostBinding('class.required')
  required: boolean;

  @HostBinding('class.focus')
  opened = false;

  @Output()
  openChange = new EventEmitter<boolean>();

  @Output()
  focusChange = new EventEmitter<void>();

  @Output()
  blurChange = new EventEmitter<void>();

  @Input()
  @HostBinding()
  tabindex = 0;

  @Input()
  opacity = 1;

  @Input()
  prompt: string;

  @Input()
  autosize: boolean;

  @Input()
  editButton = false;

  @Input()
  doneButton = false;

  @Input()
  live = false;

  @Input()
  liveDebounce = 0;

  @Output()
  enter = new EventEmitter<void>();

  @Output()
  modEnter = new EventEmitter<void>();

  @Input()
  doneOnEnter = false;

  @Input()
  disabled = false;

  @Input()
  @HostBinding('class.borderless')
  borderless = false;

  /** Formatting toolbar (bold/italic/lists/headings). Off for borderless/chat inputs. */
  @Input()
  markdownToolbar: boolean | null = null;

  destroy = inject(DestroyRef);

  _value = '';
  set value(value: string) {
    this._value = value;
  }
  get value(): string {
    return this._value;
  }
  oldValue: string;

  editor: EditorView;

  private onTouchedCallback: () => void = noop;

  private onChangeCallback: (_: string | number) => void = noop;

  onModelChanged = new Subject<string | number>();

  @ViewChild('textarea', { static: true }) textarea: ElementRef;

  @HostListener('focus')
  onFocus() {
    this.switchPopup(true);
  }

  writeValue(value: string) {
    this.value = value ?? '';
    if (this.editor) {
      this.parseValue();
    }
  }

  registerOnChange(fn: (_: string | number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  ngOnInit() {
    this.editor = new EditorView(this.textarea.nativeElement, {
      dispatchTransaction: (transaction: Transaction) => {
        const newState = this.editor.state.apply(transaction);
        this.editor.updateState(newState);
        this.value = defaultMarkdownSerializer.serialize(this.editor.state.doc);
        if (this.live) {
          if (this.liveDebounce > 0) {
            this.onModelChanged.next(this.value);
          } else {
            this.onChangeCallback(this.value);
          }
        }
        this.cd.markForCheck();
      },
      handleDOMEvents: {
        blur: () => {
          this.onFocusOut();
          return false;
        },
        focus: () => {
          this.onFocusIn();
          return false;
        },
      },
      state: this.createEditorState(),
    });
    this.editor.editable = false;
    this.onModelChanged
      .pipe(
        debounceTime(this.liveDebounce),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((value: string | number) => {
        this.onChangeCallback(value);
      });
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  onFocusOut() {
    if (!this.editButton) {
      this.switchPopup(false);
    }
  }
  onFocusIn() {
    this.switchPopup(true);
  }

  onEditButton() {
    this.switchPopup(true);
  }

  onDoneButton() {
    this.switchPopup(false);
  }

  onCancelButton() {
    this.switchPopup(false, true);
  }
  openEdit() {
    this.switchPopup(true);
  }
  switchPopup(value: boolean, omitChanges = false) {
    if (this.disabled) {
      return;
    }
    if (value === this.opened) {
      return;
    }
    if (!value) {
      this.opened = false;
      this.editor.editable = false;
      if (!omitChanges) {
        if (this.liveDebounce > 0) {
          this.onModelChanged.next(this.value);
        } else {
          this.onChangeCallback(this.value);
        }
      } else {
        this.value = this.oldValue;
        this.parseValue();

        if (this.liveDebounce > 0) {
          this.onModelChanged.next(this.value);
        } else {
          this.onChangeCallback(this.value);
        }
      }

      if (this.textarea) {
        this.textarea.nativeElement.blur();
        (
          (this.textarea.nativeElement as HTMLDivElement)
            .firstChild as HTMLDivElement
        )?.blur?.();
      }
    } else {
      this.opened = true;
      this.editor.editable = true;
      this.oldValue = this.value;
      this.setFocus();
    }
    this.openChange.next(this.opened);
    this.cd.markForCheck();
  }

  parseValue() {
    if (!this.editor) {
      return;
    }
    this.editor.updateState(this.createEditorState());
    this.editor.editable = this.opened && !this.disabled;
    this.cd.markForCheck();
  }

  private createEditorState(): EditorState {
    let doc: ProseMirrorNode;
    try {
      doc = defaultMarkdownParser.parse(this.value || '');
    } catch {
      doc = mySchema.node('doc', null, [mySchema.node('paragraph')]);
    }
    return EditorState.create({
      doc,
      plugins: this.createPlugins(),
    });
  }

  private createPlugins(): Plugin[] {
    const showToolbar =
      this.markdownToolbar !== null ? this.markdownToolbar : !this.borderless;

    const mapKeys: { [key: string]: string | false } = {
      Escape: false,
    };
    if (this.doneOnEnter) {
      mapKeys['Enter'] = false;
      mapKeys['Mod-Enter'] = false;
    }

    const plugins: Plugin[] = [
      keymap({
        Escape: () => {
          this.switchPopup(false, true);
          return true;
        },
      }),
    ];

    if (this.doneOnEnter) {
      plugins.push(
        keymap({
          Enter: () => {
            this.enter.next();
            this.switchPopup(false);
            return true;
          },
          'Mod-Enter': chainCommands(
            () => {
              this.modEnter.next();
              return false;
            },
            newlineInCode,
            createParagraphNear,
            liftEmptyBlock,
            splitBlock,
          ),
        }),
      );
    } else {
      plugins.push(
        keymap({
          'Mod-Enter': () => {
            this.modEnter.next();
            return false;
          },
        }),
      );
    }

    plugins.push(
      ...exampleSetup({
        schema: mySchema,
        menuBar: showToolbar,
        floatingMenu: false,
        mapKeys,
      }),
    );

    return plugins;
  }

  setFocus() {
    this.editor.focus();
  }
  blur(): void {
    this.switchPopup(false);
  }
}
