import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentionsListItem } from './mentions-config';
import { BaseMentionsListComponent } from './mentions-list.component';

interface TestItem {
  label: string;
}

@Component({
  selector: 'rw-test-mention-item',
  standalone: true,
  template: `{{ item?.label }}`,
})
class TestItemComponent implements MentionsListItem<TestItem> {
  @Input() item: TestItem;
  @Input() active: boolean;
}

describe('BaseMentionsListComponent', () => {
  let fixture: ComponentFixture<BaseMentionsListComponent<TestItem>>;
  let component: BaseMentionsListComponent<TestItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseMentionsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseMentionsListComponent);
    component = fixture.componentInstance;
    component.itemComponent = TestItemComponent;
  });

  function setItems(items: TestItem[]): void {
    component.items = items;
    fixture.detectChanges();
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('clamps activeIndex to the last item when items shrink', () => {
    setItems([{ label: 'a' }, { label: 'b' }, { label: 'c' }]);
    component.activeIndex = 2;
    component.limitIndex();
    expect(component.activeIndex).toBe(2);

    setItems([{ label: 'a' }]);
    expect(component.activeIndex).toBe(0);
    expect(component.activeItem).toEqual({ label: 'a' });
  });

  it('clamps activeIndex to 0 for an empty item list', () => {
    setItems([]);
    expect(component.activeIndex).toBe(0);
    expect(component.activeItem).toBeUndefined();
  });

  it('down() advances the active index and up() moves it back, both clamped', () => {
    setItems([{ label: 'a' }, { label: 'b' }, { label: 'c' }]);

    component.down();
    expect(component.activeIndex).toBe(1);
    component.down();
    expect(component.activeIndex).toBe(2);
    // clamps at the last item
    component.down();
    expect(component.activeIndex).toBe(2);

    component.up();
    expect(component.activeIndex).toBe(1);
    component.up();
    expect(component.activeIndex).toBe(0);
    // clamps at the first item
    component.up();
    expect(component.activeIndex).toBe(0);
  });

  it('select() emits itemClick with the given item and stops the click event', () => {
    setItems([{ label: 'a' }, { label: 'b' }]);
    const emitted: TestItem[] = [];
    component.itemClick.subscribe((item) => emitted.push(item));

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

    component.select({ label: 'b' }, event);

    expect(emitted).toEqual([{ label: 'b' }]);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('clicking a rendered item forwards it through itemClick', () => {
    setItems([{ label: 'a' }, { label: 'b' }]);
    const emitted: TestItem[] = [];
    component.itemClick.subscribe((item) => emitted.push(item));

    const items: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('rw-mentions-list-item'),
    );
    expect(items.length).toBe(2);
    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emitted).toEqual([{ label: 'b' }]);
  });

  describe('position()', () => {
    it('positions the list below an <input> element using caret coordinates', () => {
      const input = document.createElement('input');
      input.value = 'hello @j';
      input.style.lineHeight = '20px';
      input.style.fontSize = '14px';
      document.body.appendChild(input);
      input.setSelectionRange(8, 8);

      setItems([{ label: 'a' }]);
      component.position(input);

      expect(component.coords).toEqual(
        expect.objectContaining({
          top: expect.any(Number),
          left: expect.any(Number),
        }),
      );
      expect(fixture.nativeElement.style.position).toBe('absolute');

      document.body.removeChild(input);
    });

    it('falls back to the contenteditable/selection-based branch for a non-input parent', () => {
      // With no live selection range in the document (jsdom has none by
      // default) and no iframe, the contenteditable coordinate lookup
      // cannot resolve a range and throws - documenting current behavior.
      const div = document.createElement('div');
      document.body.appendChild(div);
      setItems([{ label: 'a' }]);

      expect(() =>
        component.position(div as unknown as HTMLInputElement),
      ).toThrow();

      document.body.removeChild(div);
    });
  });
});
