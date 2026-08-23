jest.mock('@renwu/core', () => ({}));

import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RW_BOARD_SETTINGS, RwBoardsSettings } from '../board.settings';
import { CardComponent } from './card.component';

@Component({
  standalone: true,
  selector: 'renwu-test-card-view',
  template: `view [{{ issue?.key }}]`,
})
class ViewCardComponent {
  @Input() issue: unknown;
}

@Component({
  standalone: true,
  selector: 'renwu-test-default-card-view',
  template: `default [{{ issue?.key }}]`,
})
class DefaultCardComponent {
  @Input() issue: unknown;
}

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let component: CardComponent;

  async function createComponent(
    settings: Partial<RwBoardsSettings> = {},
  ): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
      providers: [{ provide: RW_BOARD_SETTINGS, useValue: settings }],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    fixture?.destroy();
    document.body.innerHTML = '';
  });

  it('creates with no matching type and no default component configured', async () => {
    await createComponent({ components: {} });
    component.issue = { key: 'BRD-1', title: 'Untyped card' };
    component.type = 'unknown-type';

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component).toBeTruthy();
  });

  it('renders the card body from the static template when no custom view applies', async () => {
    await createComponent({ components: {} });
    component.issue = { key: 'BRD-2', title: 'Plain card' };
    component.type = 'unknown-type';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('BRD-2');
    expect(fixture.nativeElement.textContent).toContain('Plain card');
  });

  it('projects the component registered for the given type and forwards the issue', async () => {
    await createComponent({
      components: { card: ViewCardComponent, default: DefaultCardComponent },
    });
    component.issue = { key: 'BRD-3', title: 'Typed card' };
    component.type = 'card';

    fixture.detectChanges();
    // ngAfterViewInit clears the host's own static template content and
    // inserts the resolved view component next to it via ViewContainerRef;
    // it needs one more CD pass to render the child's own bindings.
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('BRD-3');
    expect(document.body.textContent).toContain('view [BRD-3]');
    expect(document.body.textContent).not.toContain('default');
  });

  it('falls back to the "default" component when the type has no dedicated view', async () => {
    await createComponent({
      components: { default: DefaultCardComponent },
    });
    component.issue = { key: 'BRD-4', title: 'Falls back' };
    component.type = 'unregistered-type';

    fixture.detectChanges();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('default [BRD-4]');
  });
});
