import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentionsListItem } from './mentions-config';
import { BaseMentionsListItemComponent } from './mentions-list-item.component';

interface TestItem {
  label: string;
}

@Component({
  selector: 'rw-test-mention-item',
  standalone: true,
  template: `{{ item?.label }} [{{ active }}]`,
})
class TestItemComponent implements MentionsListItem<TestItem> {
  @Input() item: TestItem;
  @Input() active: boolean;
}

describe('BaseMentionsListItemComponent', () => {
  let fixture: ComponentFixture<BaseMentionsListItemComponent<TestItem>>;
  let component: BaseMentionsListItemComponent<TestItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseMentionsListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseMentionsListItemComponent);
    component = fixture.componentInstance;
  });

  it('creates without an itemComponent', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.componentRef).toBeUndefined();
  });

  it('projects the configured itemComponent and forwards item/active inputs', () => {
    component.itemComponent = TestItemComponent;
    component.item = { label: 'Ada Lovelace' };
    component.active = true;

    fixture.detectChanges();

    expect(component.componentRef).toBeTruthy();
    expect(component.componentRef.instance.item).toEqual({
      label: 'Ada Lovelace',
    });
    expect(component.componentRef.instance.active).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('true');
  });

  it('propagates item/active changes to the projected component via ngOnChanges', () => {
    component.itemComponent = TestItemComponent;
    component.item = { label: 'Grace Hopper' };
    component.active = false;
    fixture.detectChanges();

    component.item = { label: 'Grace Hopper (updated)' };
    component.active = true;
    component.ngOnChanges({
      item: {
        previousValue: { label: 'Grace Hopper' },
        currentValue: component.item,
        firstChange: false,
        isFirstChange: () => false,
      },
      active: {
        previousValue: false,
        currentValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.componentRef.instance.item).toEqual({
      label: 'Grace Hopper (updated)',
    });
    expect(component.componentRef.instance.active).toBe(true);
  });

  it('ignores ngOnChanges when the projected component was never created', () => {
    expect(() =>
      component.ngOnChanges({
        item: {
          previousValue: undefined,
          currentValue: { label: 'x' },
          firstChange: true,
          isFirstChange: () => true,
        },
      }),
    ).not.toThrow();
  });
});
