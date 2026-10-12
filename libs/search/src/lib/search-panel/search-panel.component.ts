import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RwIconComponent } from '@renwu/components';
import { AvatarComponent, IssueTypeComponent } from '@renwu/core';
import { SEARCH_TRANSLOCO_SCOPE } from '../scope';
import { SearchItem, groupTranslateKey, snippetFieldKey } from '../search-results';
import { RenwuSearchService } from '../search.service';

@Component({
  selector: 'renwu-search-panel',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoPipe,
    RwIconComponent,
    AvatarComponent,
    IssueTypeComponent,
  ],
  providers: [SEARCH_TRANSLOCO_SCOPE],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPanelComponent implements AfterViewInit {
  @Input() autofocus = false;
  @Input() layout: 'page' | 'overlay' = 'overlay';

  @ViewChild('queryInput')
  queryInput?: ElementRef<HTMLInputElement>;

  readonly search = inject(RenwuSearchService);

  ngAfterViewInit(): void {
    if (this.autofocus) {
      this.focus();
    }
  }

  focus(): void {
    setTimeout(() => this.queryInput?.nativeElement.focus());
  }

  onQueryInput(event: Event): void {
    this.search.setQuery((event.target as HTMLInputElement).value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.search.moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.search.moveActive(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search.openActive();
    }
  }

  onItemEnter(item: SearchItem, index: number): void {
    this.search.setActiveIndex(index);
  }

  openItem(item: SearchItem): void {
    this.search.openItem(item);
  }

  groupKey(group: { id: string; label: string; order: number; items: SearchItem[] }): string {
    return groupTranslateKey(group);
  }

  fieldKey(item: SearchItem): string {
    return snippetFieldKey(item.snippetField);
  }
}
