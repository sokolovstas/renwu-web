import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwDropDownComponent } from '@renwu/components';
import {
  BaseMentionsListComponent,
  BaseMentionsListItemComponent,
} from '@renwu/mentions';

@Component({
  selector: 'renwu-mentions-list',
  standalone: true,
  imports: [BaseMentionsListItemComponent, TranslocoPipe],
  styleUrl: './mentions-list.component.scss',
  templateUrl: './mentions-list.component.html',
})
export class MentionsListComponent<T> extends BaseMentionsListComponent<T> {
  @ViewChild('dropdown', { static: false })
  dropdown: RwDropDownComponent;

  constructor() {
    const elementRef = inject(ElementRef);
    const cd = inject(ChangeDetectorRef);

    super(elementRef, cd);
  }

  protected override positionElement(): void {
    globalThis.setTimeout(() => {
      this.dropdown.show();
    }, 100);
  }
}
