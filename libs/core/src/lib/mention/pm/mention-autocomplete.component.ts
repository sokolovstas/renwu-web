import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  Type,
  inject,
} from '@angular/core';
import { BaseMentionsListItemComponent, MentionsListItem } from '@renwu/mentions';

@Component({
  selector: 'renwu-mention-autocomplete',
  standalone: true,
  imports: [BaseMentionsListItemComponent],
  template: `
    <ul class="rw-mention-ac-list">
      @for (item of items; track trackItem($index, item); let i = $index) {
        <rw-mentions-list-item
          [active]="i === activeIndex"
          [item]="item"
          [itemComponent]="itemComponent"
          (mousedown)="onPick(item, $event)"
          (mouseenter)="activeIndex = i"
        />
      }
      @if (!items?.length) {
        <li class="rw-mention-ac-empty">No matches</li>
      }
    </ul>
  `,
  styleUrl: './mention-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionAutocompleteComponent {
  private cd = inject(ChangeDetectorRef);

  @Input()
  set items(value: unknown[]) {
    this._items = value || [];
    if (this.activeIndex >= this._items.length) {
      this.activeIndex = Math.max(0, this._items.length - 1);
    }
    this.cd.markForCheck();
  }
  get items(): unknown[] {
    return this._items;
  }
  private _items: unknown[] = [];

  @Input()
  itemComponent: Type<MentionsListItem<unknown>>;

  @Input()
  activeIndex = 0;

  @Output()
  pick = new EventEmitter<unknown>();

  trackItem(index: number, item: unknown): unknown {
    const rec = item as { id?: string; key?: string; username?: string };
    return rec?.id || rec?.key || rec?.username || index;
  }

  move(delta: number): void {
    if (!this._items.length) {
      return;
    }
    this.activeIndex =
      (this.activeIndex + delta + this._items.length) % this._items.length;
    this.cd.markForCheck();
  }

  activeItem(): unknown | null {
    return this._items[this.activeIndex] ?? null;
  }

  onPick(item: unknown, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pick.emit(item);
  }
}
