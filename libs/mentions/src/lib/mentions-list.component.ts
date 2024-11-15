import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Type,
  ViewChild,
} from '@angular/core';
import { getCaretCoordinates } from './caret-coords';
import {
  getContentEditableCaretCoords,
  isInputOrTextAreaElement,
} from './mention-utils';
import { MentionsList, MentionsListItem } from './mentions-config';
import { BaseMentionsListItemComponent } from './mentions-list-item.component';

@Component({
  selector: 'rw-mentions-list',
  standalone: true,
  imports: [BaseMentionsListItemComponent],
  styleUrl: './mentions-list.component.scss',
  template: `
    <ul
      #list
      class="mention-menu dropdown-menu scrollable-menu"
      [class.mention-dropdown]="dropUp"
      >
      @for (item of items; track item; let i = $index) {
        <rw-mentions-list-item
          [active]="activeIndex === i"
          [item]="item"
          [labelKey]="labelKey"
          [itemComponent]="itemComponent"
          (click)="select(item, $event)"
          (mouseenter)="activeIndex = i; activeItem = item"
          >
        </rw-mentions-list-item>
      }
    </ul>
    `,
})
export class BaseMentionsListComponent<T> implements MentionsList<T> {
  @Output()
  itemClick = new EventEmitter<T>();
  @Output()
  activeItem: T;
  @Input()
  itemComponent: Type<MentionsListItem<T>>;
  @Input()
  private _items: T[];
  public get items(): T[] {
    return this._items;
  }
  public set items(value: T[]) {
    this._items = value;
    this.limitIndex();
  }

  // private
  @Input()
  labelKey = 'label';

  @ViewChild('list')
  list: ElementRef;

  dropUp = false;

  activeIndex = 0;

  protected coords: { top: number; left: number } = { top: 0, left: 0 };
  protected offset = 0;
  constructor(
    protected element: ElementRef,
    protected cd: ChangeDetectorRef,
  ) {}

  up(): void {
    this.activeIndex--;
    this.limitIndex();
  }
  down(): void {
    this.activeIndex++;
    this.limitIndex();
  }

  limitIndex(): void {
    this.activeIndex = Math.max(
      Math.min(this.activeIndex, this.items.length - 1),
      0,
    );
    this.activeItem = this.items[this.activeIndex];

    this.cd.detectChanges();

    // adjust scrollable-menu offset if the next item is out of view
    if (this.list?.nativeElement) {
      const listEl: HTMLElement = this.list.nativeElement as HTMLElement;
      const activeEl = listEl.getElementsByClassName('active').item(0);
      if (activeEl) {
        const listRect = listEl.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();
        listEl.scrollTop += Math.min(itemRect.top - 10 - listRect.top, 0);
        listEl.scrollTop += Math.max(itemRect.bottom + 10 - listRect.bottom, 0);
      }
    }
  }

  // lots of confusion here between relative coordinates and containers
  position(
    nativeParentElement: HTMLInputElement,
    iframe: HTMLIFrameElement = null,
  ): void {
    if (isInputOrTextAreaElement(nativeParentElement)) {
      // parent elements need to have postition:relative for this to work correctly?
      this.coords = getCaretCoordinates(
        nativeParentElement,
        nativeParentElement.selectionStart,
        null,
      );
      this.coords.top =
        nativeParentElement.offsetTop +
        this.coords.top -
        nativeParentElement.scrollTop;
      this.coords.left =
        nativeParentElement.offsetLeft +
        this.coords.left -
        nativeParentElement.scrollLeft;
      // getCretCoordinates() for text/input elements needs an additional offset to position the list correctly
      this.offset = this.getBlockCursorDimensions(nativeParentElement).height;
    } else if (iframe) {
      const context: { iframe: HTMLIFrameElement; parent: Element } = {
        iframe: iframe,
        parent: iframe.offsetParent,
      };
      this.coords = getContentEditableCaretCoords(context);
    } else {
      const doc = document.documentElement;
      const scrollLeft =
        (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      const scrollTop =
        (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      // bounding rectangles are relative to view, offsets are relative to container?
      const caretRelativeToView = getContentEditableCaretCoords({
        iframe: iframe,
      });
      const parentRelativeToContainer: ClientRect =
        nativeParentElement.getBoundingClientRect();
      this.coords.top =
        caretRelativeToView.top -
        parentRelativeToContainer.top +
        nativeParentElement.offsetTop -
        scrollTop;
      this.coords.left =
        caretRelativeToView.left -
        parentRelativeToContainer.left +
        nativeParentElement.offsetLeft -
        scrollLeft;
    }
    // set the default/inital position
    this.positionElement();
  }

  select(item: T, event: MouseEvent): void {
    this.itemClick.emit(item);
    event.preventDefault();
    event.stopPropagation();
  }

  // final positioning is done after the list is shown (and the height and width are known)
  // ensure it's in the page bounds
  protected checkBounds(): void {
    let left = this.coords.left;
    const top = this.coords.top;
    let dropUp = this.dropUp;
    const bounds: ClientRect = (
      this.list.nativeElement as HTMLElement
    ).getBoundingClientRect();
    // if off right of page, align right
    if (bounds.left + bounds.width > window.innerWidth) {
      left -= bounds.left + bounds.width - window.innerWidth + 10;
    }
    // if more than half off the bottom of the page, force dropUp
    if (bounds.top + bounds.height / 2 > window.innerHeight) {
      dropUp = true;
    }
    // if top is off page, disable dropUp
    if (bounds.top < 0) {
      dropUp = false;
    }
    // set the revised/final position
    this.positionElement(left, top, dropUp);
  }

  protected positionElement(
    left: number = this.coords.left,
    top: number = this.coords.top,
    dropUp: boolean = this.dropUp,
  ): void {
    const el: HTMLElement = this.element.nativeElement as HTMLElement;
    top += dropUp ? 0 : this.offset; // top of list is next line
    el.className = dropUp ? 'dropup' : null;
    el.style.position = 'absolute';
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  protected getBlockCursorDimensions(nativeParentElement: HTMLInputElement): {
    height: number;
    width: number;
  } {
    const parentStyles = window.getComputedStyle(nativeParentElement);
    return {
      height: parseFloat(parentStyles.lineHeight),
      width: parseFloat(parentStyles.fontSize),
    };
  }
}
