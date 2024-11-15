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
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RwButtonComponent } from '../button/button.component';

import { baseKeymap } from 'prosemirror-commands';
import { gapCursor } from 'prosemirror-gapcursor';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import {
  chainCommands,
  createParagraphNear,
  exitCode,
  joinDown,
  joinUp,
  lift,
  liftEmptyBlock,
  newlineInCode,
  setBlockType,
  splitBlock,
  toggleMark,
  wrapIn,
} from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { Schema } from 'prosemirror-model';


import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} from 'prosemirror-markdown';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

const noop = () => {
  return;
};

export const TEXTAREA_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RwTextAreaComponent),
  multi: true,
};

export const mySchema = new Schema({
  nodes: schema.spec.nodes,
  marks: schema.spec.marks,
});
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
export class RwTextAreaComponent implements OnInit, ControlValueAccessor {
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

  documentClickListener: () => void;

  onModelChanged = new Subject<string | number>();

  @ViewChild('textarea', { static: true }) textarea: ElementRef;

  constructor(
    public el: ElementRef,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
  ) {
    // this.focusSource = focusSource();
  }

  @HostListener('focus', ['$event'])
  onFocus() {
    this.switchPopup(true);
  }

  writeValue(value: string) {
    this.value = value;
    this.parseValue();
    // this.formatted = this.generatePreview(this.value);
  }

  registerOnChange(fn: (_: string | number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  ngOnInit() {
    this.editor = new EditorView(this.textarea.nativeElement, {
      dispatchTransaction: (transaction) => {
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
          return;
        },
        focus: () => {
          this.onFocusIn();
        },
      },
      handleKeyDown: (view, event) => {
        this.onKeyDown(event);
      },
      state: EditorState.create({
        schema: mySchema,
      }),
      // editable: () => {
      //   return this.opened;
      // },
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

  // inactiveClick(eventMouse: any) {
  //   if (!this.editButton && eventMouse.target.localName !== 'a') {
  //     this.switchPopup(true);
  //     // this.ignoreOpen = false;
  //   }
  // }

  onFocusOut() {
    if (!this.editButton) {
      this.switchPopup(false);
    }
  }
  onFocusIn() {
    this.switchPopup(true);
    // clearTimeout(this.focusOutTimeout);
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
    // if (value && this.ignoreOpen) {
    //   return;
    // }
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
        ).blur();
      }
      // this.formatted = this.generatePreview(this.value);

      // if (this.documentClickListener) {
      //   this.documentClickListener();
      // }
    } else {
      this.opened = true;
      this.editor.editable = true;
      this.oldValue = this.value;
      this.setFocus();

      // const event = new MouseEvent('click', {
      //   view: window,
      //   bubbles: true,
      //   cancelable: true,
      // });
      // window.dispatchEvent(event);

      // if (this.documentClickListener) {
      //   this.documentClickListener();
      // }
      // this.documentClickListener = this.renderer.listen(
      //   'window',
      //   'click',
      //   () => {
      //     this.onFocusOut();
      //   }
      // );
    }
    this.openChange.next(this.opened);
    this.cd.markForCheck();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.switchPopup(false, true);
      return;
    }
  }

  parseValue() {
    this.editor.updateState(
      EditorState.create({
        doc: defaultMarkdownParser.parse(this.value || ''),
        schema: mySchema,
        plugins: [gapCursor(), history(), keymap(this.buildKeymap())],
      }),
    );
    this.cd.markForCheck();
  }

  buildKeymap() {
    const mac =
      typeof navigator != 'undefined'
        ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
        : false;
    const customKeymap = baseKeymap;
    if (!this.doneOnEnter) {
      customKeymap['Enter'] = chainCommands(
        () => {
          this.enter.next();
          return true;
        },
        newlineInCode,
        createParagraphNear,
        liftEmptyBlock,
        splitBlock,
      );
      customKeymap['Mod-Enter'] = chainCommands(() => {
        this.modEnter.next();
        this.switchPopup(false);
        return true;
      });
    } else {
      customKeymap['Enter'] = chainCommands(() => {
        this.enter.next();
        this.switchPopup(false);
        return true;
      });
      customKeymap['Mod-Enter'] = chainCommands(
        () => {
          this.modEnter.next();
          return true;
        },
        newlineInCode,
        createParagraphNear,
        liftEmptyBlock,
        splitBlock,
      );
    }

    customKeymap['Esc'] = exitCode;
    customKeymap['Mod-z'] = undo;
    customKeymap['Shift-Mod-z'] = redo;
    if (!mac) customKeymap['Mod-y'] = redo;

    customKeymap['Alt-ArrowUp'] = joinUp;
    customKeymap['Alt-ArrowDown'] = joinDown;
    customKeymap['Mod-BracketLeft'] = lift;
    // customKeymap["Escape"] = selectParentNode

    customKeymap['Mod-b'] = toggleMark(schema.marks.strong);
    customKeymap['Mod-B'] = toggleMark(schema.marks.strong);
    customKeymap['Mod-i'] = toggleMark(schema.marks.em);
    customKeymap['Mod-I'] = toggleMark(schema.marks.em);

    customKeymap['Mod-`'] = toggleMark(schema.marks.code);

    // customKeymap['Shift-Ctrl-8'] = wrapInList(schema.nodes.bullet_list);
    // customKeymap['Shift-Ctrl-9'] = wrapInList(schema.nodes.ordered_list);
    customKeymap['Mod->'] = wrapIn(schema.nodes.blockquote);

    // if (type = schema.nodes.hard_break) {
    //   let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
    //     if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
    //     return true
    //   })
    //   customKeymap["Mod-Enter"] = cmd)
    //   customKeymap["Shift-Enter"] = cmd)
    //   if (mac) customKeymap["Ctrl-Enter"] = cmd)
    // }
    // if (type = schema.nodes.list_item) {
    //   customKeymap["Enter"] = splitListItem(type))
    //   customKeymap["Mod-["] = liftListItem(type))
    //   customKeymap["Mod-]"] = sinkListItem(type))
    // }
    // if (type = schema.nodes.paragraph)
    //   customKeymap["Shift-Ctrl-0"] = setBlockType(type))
    customKeymap['Shift-Ctrl-\\'] = setBlockType(schema.nodes.code_block);
    // if (type = schema.nodes.heading)
    //   for (let i = 1; i <= 6; i++) customKeymap["Shift-Ctrl-" + i] = setBlockType(type, {level: i}))
    const hr = schema.nodes.horizontal_rule;
    customKeymap['Mod-_'] = (state, dispatch) => {
      if (dispatch)
        dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    };
    return customKeymap;
  }

  setFocus() {
    this.editor.focus();
  }
  blur(): void {
    this.switchPopup(false);
  }
}
