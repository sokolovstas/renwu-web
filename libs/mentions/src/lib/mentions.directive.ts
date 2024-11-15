/**
 * Angular Mentions.
 * https://github.com/dmacfarlane/angular-mentions
 *
 * Copyright (c) 2017 Dan MacFarlane
 */
import {
  ComponentFactoryResolver,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnChanges,
  Optional,
  Output,
  SimpleChanges,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { switchMap, takeUntil } from 'rxjs/operators';
import {
  getCaretPosition,
  getValue,
  insertValue,
  setCaretPosition,
} from './mention-utils';
import {
  Mentions,
  MentionsConfig,
  MentionsList,
  RW_MENTIONS_MODULE_CONFIG,
  RwMentionsModuleConfig,
} from './mentions-config';

const KEY_BACKSPACE = 8;
const KEY_TAB = 9;
const KEY_ENTER = 13;
const KEY_SHIFT = 16;
const KEY_ESCAPE = 27;
const KEY_SPACE = 32;
// const KEY_LEFT = 37;
const KEY_UP = 38;
// const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_BUFFERED = 229;
type ExtendedKeyboardEvent = Partial<KeyboardEvent> & {
  data?: string;
  wasClick?: boolean;
  inputEvent?: boolean;
};

@Directive({
  selector: '[rwMentions]',
})
export class MentionsDirective implements OnChanges {
  destroy = inject(DestroyRef);

  @Input('rwMentions')
  mentionConfig: MentionsConfig = { mentions: [] };

  @Input()
  mentionsListComponent = this.config.mentionsListComponent;

  @HostBinding('attr.autocomplete')
  autocomplete = 'off';

  private activeConfig: Mentions<unknown> | null = null;

  @Output()
  searchTerm = new EventEmitter<string>();

  @Output()
  opened = new EventEmitter<void>();

  @Output()
  closed = new EventEmitter<void>();

  // Trigger char to mention config
  private triggerChars: { [key: string]: Mentions<unknown> } = {};

  private startPos = 0;
  private startNode?: HTMLInputElement;
  private serachListRef?: ComponentRef<MentionsList<unknown>>;
  private searchList: MentionsList<unknown> | null = null;
  private searching = false;
  private iframe?: HTMLIFrameElement; // optional
  private lastKeyCode?: number;

  constructor(
    @Optional()
    @Inject(RW_MENTIONS_MODULE_CONFIG)
    private config: RwMentionsModuleConfig,
    private _element: ElementRef,
    private _componentResolver: ComponentFactoryResolver,
    private _viewContainerRef: ViewContainerRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mentionConfig']) {
      this.updateConfig();
    }
  }

  private selectItem(
    selectedItem: unknown,
    pos: number,
    nativeElement: HTMLInputElement = this._element
      .nativeElement as HTMLInputElement,
  ) {
    if (!this.activeConfig) {
      return;
    }
    // optional function to format the selected item before inserting the text
    const text = this.activeConfig.mentionSelect
      ? this.activeConfig.mentionSelect(
          selectedItem,
          this.activeConfig.triggerChars,
        )
      : (selectedItem as string);
    // value is inserted without a trailing space for consistency
    // between element types (div and iframe do not preserve the space)
    insertValue(nativeElement, this.startPos, pos, text, this.iframe);
    // fire input event so angular bindings are updated
    if ('createEvent' in document) {
      const evt = document.createEvent('HTMLEvents');
      if (this.iframe) {
        // a 'change' event is required to trigger tinymce updates
        evt.initEvent('change', true, false);
      } else {
        evt.initEvent('input', true, false);
      }
      // this seems backwards, but fire the event from this elements nativeElement (not the
      // one provided that may be in an iframe, as it won't be propogate)
      (this._element.nativeElement as HTMLElement).dispatchEvent(evt);
    }
    this.startPos = -1;
    this.stopSearch();
    return;
  }

  public updateConfig(): void {
    this.mentionConfig?.mentions?.forEach((config) => this.addConfig(config));
  }

  // add configuration for a trigger char
  private addConfig(config: Mentions<unknown>) {
    // add the config
    config.triggerChars.forEach((char) => {
      this.triggerChars[char] = config;
    });
  }

  setIframe(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
  }

  stopEvent(event: ExtendedKeyboardEvent): void {
    if (!event.wasClick) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  @HostListener('blur', ['$event'])
  blurHandler(event: FocusEvent): void {
    // allow click to work
    setTimeout(() => {
      this.stopEvent(event);
      this.stopSearch();
    }, 100);
  }

  @HostListener('input', ['$event'])
  inputHandler(
    event: ExtendedKeyboardEvent,
    nativeElement: HTMLInputElement = this._element
      .nativeElement as HTMLInputElement,
  ): void {
    if (this.lastKeyCode === KEY_BUFFERED && event.data) {
      const keyCode = event.data.charCodeAt(0);
      this.keyHandler({ keyCode, inputEvent: true }, nativeElement);
    }
  }

  // @param nativeElement is the alternative text element in an iframe scenario
  @HostListener('keydown', ['$event'])
  keyHandler(
    event: ExtendedKeyboardEvent,
    nativeElement: HTMLInputElement = this._element
      .nativeElement as HTMLInputElement,
  ): void {
    this.lastKeyCode = event.keyCode;

    if (event.isComposing || event.keyCode === KEY_BUFFERED) {
      return;
    }

    const val: string = getValue(nativeElement);
    let pos = getCaretPosition(nativeElement, this.iframe);
    let charPressed = event.key;
    if (!charPressed) {
      const charCode = event.which || event.keyCode;
      if (!event.shiftKey && charCode && charCode >= 65 && charCode <= 90) {
        charPressed = String.fromCharCode(charCode + 32);
      } else {
        // TODO (dmacfarlane) fix this for non-alpha keys
        // http://stackoverflow.com/questions/2220196/how-to-decode-character-pressed-from-jquerys-keydowns-event-handler?lq=1
        charPressed = String.fromCharCode(event.which || event.keyCode);
      }
    }
    if (event.keyCode == KEY_ENTER && event.wasClick && pos < this.startPos) {
      // put caret back in position prior to contenteditable menu click
      // pos = this.startNode.length;
      setCaretPosition(this.startNode, pos, this.iframe);
    }

    const config = this.triggerChars[charPressed];
    if (config) {
      this.activeConfig = config;
      this.startPos = event.inputEvent ? pos - 1 : pos;
      this.startNode = (
        this.iframe
          ? this.iframe.contentWindow.getSelection()
          : window.getSelection()
      ).anchorNode as HTMLInputElement;
      this.searching = true;
      // this.searchString = null;
      this.showSearchList(nativeElement);

      // if (config.returnTrigger) {
      this.searchTerm.next('');
      // }
    } else if (this.startPos >= 0 && this.searching) {
      if (pos <= this.startPos) {
        this.stopSearch();
      }
      // ignore shift when pressed alone, but not when used with another key
      else if (
        event.keyCode !== KEY_SHIFT &&
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey &&
        pos > this.startPos
      ) {
        if (!this.activeConfig.allowSpace && event.keyCode === KEY_SPACE) {
          this.startPos = -1;
        } else if (event.keyCode === KEY_BACKSPACE && pos > 0) {
          pos--;
          if (pos == this.startPos) {
            this.stopSearch();
          }
        } else {
          if (event.keyCode === KEY_TAB || event.keyCode === KEY_ENTER) {
            this.stopEvent(event);
            this.selectItem(this.searchList.activeItem, pos, nativeElement);
            this.startPos = -1;
            this.stopSearch();
            return;
          } else if (event.keyCode === KEY_ESCAPE) {
            this.stopEvent(event);
            this.stopSearch();
            return;
          } else if (event.keyCode === KEY_DOWN) {
            this.stopEvent(event);
            this.searchList.down();
            return;
          } else if (event.keyCode === KEY_UP) {
            this.stopEvent(event);
            this.searchList.up();
            return;
          }
        }

        if (charPressed.length != 1 && event.keyCode != KEY_BACKSPACE) {
          this.stopEvent(event);
          return;
        } else if (this.searching) {
          let mention = val.substring(this.startPos + 1, pos);
          if (event.keyCode !== KEY_BACKSPACE && !event.inputEvent) {
            mention += charPressed;
          }
          this.searchTerm.next(mention);
        }
      }
    }
  }

  // exposed for external calls to open the mention list, e.g. by clicking a button
  public startSearch(
    triggerChar?: string,
    nativeElement: HTMLInputElement = this._element
      .nativeElement as HTMLInputElement,
  ): void {
    const pos = getCaretPosition(nativeElement, this.iframe);
    insertValue(nativeElement, pos, pos, triggerChar, this.iframe);
    this.keyHandler({ key: triggerChar, inputEvent: true }, nativeElement);
  }

  stopSearch(): void {
    if (this.searchList) {
      this.serachListRef.destroy();
      this.closed.next();
    }
    this.activeConfig = null;
    this.searching = false;
  }

  showSearchList(nativeElement: HTMLInputElement): void {
    if (!this.activeConfig) {
      return;
    }

    this.opened.next();

    const componentFactory = this._componentResolver.resolveComponentFactory(
      this.mentionsListComponent,
    );
    this.serachListRef =
      this._viewContainerRef.createComponent(componentFactory);
    this.searchList = this.serachListRef.instance;
    this.searchList.itemComponent = this.activeConfig.itemComponent;
    this.searchTerm
      .pipe(
        switchMap((search) => this.activeConfig.getItems(search)),
        takeUntil(this.closed),
      )
      .subscribe((items) => {
        this.searchList.items = items;
        this.serachListRef.changeDetectorRef.detectChanges();
      });

    this.searchList.itemClick.pipe(takeUntil(this.closed)).subscribe(() => {
      nativeElement.focus();
      const fakeKeydown: ExtendedKeyboardEvent = {
        key: 'Enter',
        keyCode: KEY_ENTER,
        wasClick: true,
      };
      this.keyHandler(fakeKeydown, nativeElement);
    });
    if (this.activeConfig.searchListProps) {
      Object.assign(this.searchList, this.activeConfig.searchListProps);
    }
    this.serachListRef.changeDetectorRef.detectChanges();
    this.searchList.position(nativeElement, this.iframe);
  }
}
