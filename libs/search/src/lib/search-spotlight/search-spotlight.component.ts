import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { SearchPanelComponent } from '../search-panel/search-panel.component';
import { SEARCH_TRANSLOCO_SCOPE } from '../scope';
import { RenwuSearchService } from '../search.service';

@Component({
  selector: 'renwu-search-spotlight',
  standalone: true,
  imports: [AsyncPipe, TranslocoPipe, SearchPanelComponent],
  providers: [SEARCH_TRANSLOCO_SCOPE],
  templateUrl: './search-spotlight.component.html',
  styleUrl: './search-spotlight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSpotlightComponent {
  @ViewChild(SearchPanelComponent)
  panel?: SearchPanelComponent;

  readonly search = inject(RenwuSearchService);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    this.search.overlayOpen$
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((open) => {
        if (open) {
          setTimeout(() => this.panel?.focus());
        }
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.search.hideOverlay();
    }
  }
}
