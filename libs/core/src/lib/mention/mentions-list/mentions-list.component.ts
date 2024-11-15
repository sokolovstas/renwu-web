import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
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

  constructor(elementRef: ElementRef, cd: ChangeDetectorRef) {
    super(elementRef, cd);
  }

  protected override positionElement(): void {
    globalThis.setTimeout(() => {
      this.dropdown.show();
    }, 100);
  }
}
