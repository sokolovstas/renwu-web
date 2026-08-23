import { Component, EventEmitter, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Mentions, MentionsConfig, RW_MENTIONS_MODULE_CONFIG } from './mentions-config';
import { MentionsDirective } from './mentions.directive';

interface TestItem {
  label: string;
}

@Component({
  standalone: true,
  selector: 'rw-test-mentions-list',
  template: '',
})
class TestListComponent {
  items: TestItem[] = [];
  activeItem: TestItem | null = null;
  itemComponent: unknown;
  itemClick = new EventEmitter<TestItem>();
  labelKey = 'label';
  position = jest.fn();
  up = jest.fn();
  down = jest.fn();
}

@Component({
  standalone: true,
  selector: 'rw-test-mentions-item',
  template: '',
})
class TestItemComponent {
  @Input() item: TestItem;
  @Input() active: boolean;
}

@Component({
  standalone: true,
  imports: [MentionsDirective],
  template: `<input
    rwMentions
    [rwMentions]="config"
    (searchTerm)="onSearchTerm($event)"
    (opened)="onOpened()"
    (closed)="onClosed()"
  />`,
})
class HostComponent {
  @ViewChild(MentionsDirective, { static: true }) directive: MentionsDirective;

  getItems = jest.fn((filter: string) => of([{ label: filter || 'all' }]));
  mentionSelect = jest.fn((item: TestItem) => `@${item.label}`);

  config: MentionsConfig = {
    mentions: [
      {
        triggerChars: ['@'],
        itemComponent: TestItemComponent,
        getItems: this.getItems,
        mentionSelect: this.mentionSelect,
      } as Mentions<TestItem>,
    ],
  };

  searchTerms: string[] = [];
  openedCount = 0;
  closedCount = 0;

  onSearchTerm(term: string): void {
    this.searchTerms.push(term);
  }
  onOpened(): void {
    this.openedCount++;
  }
  onClosed(): void {
    this.closedCount++;
  }
}

describe('MentionsDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let directive: MentionsDirective;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: RW_MENTIONS_MODULE_CONFIG,
          useValue: { mentionsListComponent: TestListComponent },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    directive = host.directive;
    input = fixture.nativeElement.querySelector('input');
  });

  function setCaret(value: string, pos: number): void {
    input.value = value;
    input.setSelectionRange(pos, pos);
  }

  it('does not open a search on an unrelated keystroke', () => {
    setCaret('', 0);
    directive.keyHandler({ key: 'x', keyCode: 88 }, input);

    expect(host.openedCount).toBe(0);
    expect(host.searchTerms).toEqual([]);
  });

  it('opens the search list and emits an empty search term when a trigger char is typed', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);

    expect(host.openedCount).toBe(1);
    expect(host.searchTerms).toEqual(['']);
    expect(host.getItems).toHaveBeenCalledWith('');
  });

  it('accumulates typed characters into the search term after the trigger', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);

    // simulate the browser inserting '@' after the keydown handler ran
    setCaret('@', 1);
    directive.keyHandler({ key: 'a', keyCode: 65 }, input);
    expect(host.searchTerms).toEqual(['', 'a']);

    // simulate the browser inserting 'a'
    setCaret('@a', 2);
    directive.keyHandler({ key: 'l', keyCode: 76 }, input);
    expect(host.searchTerms).toEqual(['', 'a', 'al']);
    expect(host.getItems).toHaveBeenLastCalledWith('al');
  });

  it('stops the search when the caret moves back to (or before) the trigger position', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);
    setCaret('@', 1);
    directive.keyHandler({ key: 'a', keyCode: 65 }, input);

    expect(host.closedCount).toBe(0);

    // caret moved back onto the trigger char itself (e.g. via ArrowLeft)
    setCaret('@a', 0);
    directive.keyHandler({ key: 'ArrowLeft', keyCode: 37 }, input);

    expect(host.closedCount).toBe(1);
  });

  it('Escape closes the search and prevents the default keydown behavior', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);
    setCaret('@', 1);

    const event = {
      key: 'Escape',
      keyCode: 27,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    };
    directive.keyHandler(event, input);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(host.closedCount).toBe(1);
  });

  it('ArrowDown/ArrowUp forward navigation to the search list without closing it', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);
    setCaret('@', 1);

    const searchList = (directive as unknown as { searchList: TestListComponent })
      .searchList;

    directive.keyHandler(
      {
        key: 'ArrowDown',
        keyCode: 40,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
      },
      input,
    );
    expect(searchList.down).toHaveBeenCalledTimes(1);

    directive.keyHandler(
      {
        key: 'ArrowUp',
        keyCode: 38,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
      },
      input,
    );
    expect(searchList.up).toHaveBeenCalledTimes(1);
    expect(host.closedCount).toBe(0);
  });

  it('Enter selects the active item, formats it via mentionSelect and inserts it into the value', () => {
    setCaret('', 0);
    directive.keyHandler({ key: '@', keyCode: 64 }, input);
    setCaret('@', 1);
    directive.keyHandler({ key: 'a', keyCode: 65 }, input);
    setCaret('@a', 2);

    const searchList = (directive as unknown as { searchList: TestListComponent })
      .searchList;
    searchList.activeItem = { label: 'alice' };

    directive.keyHandler(
      {
        key: 'Enter',
        keyCode: 13,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
      },
      input,
    );

    expect(host.mentionSelect).toHaveBeenCalledWith({ label: 'alice' }, ['@']);
    expect(input.value).toBe('@alice');
    // selectItem() and the Enter branch both call stopSearch(), so `closed`
    // fires twice for a single selection - documenting current behavior.
    expect(host.closedCount).toBe(2);
  });

  it('startSearch() opens the list programmatically for a given trigger char', () => {
    setCaret('hello ', 6);

    directive.startSearch('@');

    expect(host.openedCount).toBe(1);
    expect(input.value).toBe('hello @');
  });

  it('stopSearch() is a no-op when no search is active', () => {
    expect(() => directive.stopSearch()).not.toThrow();
    expect(host.closedCount).toBe(0);
  });
});
