// Note: keep imports minimal; this file is standalone and NG8113 reports unused entries.
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDropDownComponent,
  RwIconComponent,
  RwPreventParentScrollDirective,
} from '@renwu/components';
import { catchError, forkJoin, of } from 'rxjs';
import { RwDataService } from '../data/data.service';
import { OQLParseListener } from '../search/oql/OQLParseListener';
import OQLParser, {
  AtomContext,
  ExpressionContext,
} from '../search/oql/OQLParser';
import { RwQueryBuilderService } from '../search/query-builder.service';
import {
  SavedSearchQuery,
  SearchHint,
  SearchHintType,
  SearchHistory,
  SearchParamType,
} from '../search/search.model';

const HISTORY_LIMIT = 20;

export type QueryListItem =
  | { kind: 'separator'; id: string; label: string }
  | {
      kind: 'saved';
      id: string;
      label: string;
      title?: string;
      query: string;
      saved: SavedSearchQuery;
    }
  | {
      kind: 'history';
      id: string;
      label: string;
      query: string;
    };

@Component({
  selector: 'renwu-query-builder',
  standalone: true,
  imports: [
    RwDropDownComponent,
    RwButtonComponent,
    FormsModule,
    RwIconComponent,
    RwCheckboxComponent,
    RwPreventParentScrollDirective,
    TranslocoPipe,
  ],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class QueryBuilderComponent {
  cd = inject(ChangeDetectorRef);
  SearchHintType = SearchHintType;
  SearchParamType = SearchParamType;
  OQLParser = OQLParser;

  queryBuilderService = inject(RwQueryBuilderService);
  private dataService = inject(RwDataService);

  @ViewChild('hintDropdown', { read: RwDropDownComponent, static: false })
  hintDropdown: RwDropDownComponent;

  @ViewChild('queriesDropdown', { read: RwDropDownComponent, static: false })
  queriesDropdown: RwDropDownComponent;

  @ViewChildren('searchInput')
  searchInput: QueryList<ElementRef>;

  hints = signal<Array<SearchHint>>([]);
  loadedHints = signal<Array<SearchHint>>([]);
  hintHovered = signal(-1);
  prevSelectionStart = signal(-1);
  prevContext: AtomContext;

  queryListItems = signal<QueryListItem[]>([]);
  queryListLoading = signal(false);
  queryListHovered = signal(-1);

  errors = computed(
    () => new OQLParseListener(this.queryString()).errors.length,
  );

  tree = computed<ExpressionContext>(
    () => new OQLParseListener(this.queryString()).tree as ExpressionContext,
  );

  isEmpty = computed(
    () =>
      !this.tree()?.children[0] ||
      (this.tree()?.children[0] as AtomContext).getChildCount() === 0,
  );

  showTextInput = signal(false);

  queryString = signal('');

  selectedQuery = signal<SavedSearchQuery>(null);

  hintTextString = signal('');

  multipleSelectHint = signal(false);

  inputFocus = signal(false);

  showHintsContainer = computed(() => this.hints().length > 0);

  @Output()
  queryChange = new EventEmitter<string>();

  @Input()
  emitOnChange = false;

  @Input()
  disabled = false;

  @Input()
  set query(value: string) {
    this.queryString.set(value ?? '');
  }

  onQueriesDisplayed(): void {
    if (this.disabled) {
      this.queriesDropdown?.closeDropdown();
      return;
    }
    this.queryListLoading.set(true);
    this.queryListHovered.set(-1);
    forkJoin({
      saved: this.dataService
        .getSearchQueries()
        .pipe(catchError(() => of([] as SavedSearchQuery[]))),
      history: this.dataService
        .searchHistory()
        .pipe(catchError(() => of([] as SearchHistory[]))),
    }).subscribe(({ saved, history }) => {
      this.queryListItems.set(this.buildQueryList(saved ?? [], history ?? []));
      this.queryListLoading.set(false);
      this.cd.markForCheck();
    });
  }

  selectStoredQuery(item: QueryListItem, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (item.kind === 'separator') {
      return;
    }
    this.queriesDropdown?.closeDropdown();
    this.clearHints();
    this.queryString.set(item.query);
    this.selectedQuery.set(item.kind === 'saved' ? item.saved : null);
    if (this.searchInput?.first) {
      const input = this.searchInput.first
        .nativeElement as HTMLInputElement;
      input.value = item.query;
    }
    this.queryChange.next(item.query);
  }

  private buildQueryList(
    saved: SavedSearchQuery[],
    history: SearchHistory[],
  ): QueryListItem[] {
    const items: QueryListItem[] = [];

    if (saved.length) {
      items.push({
        kind: 'separator',
        id: 'sep-saved',
        label: 'core.query-builder-saved',
      });
      for (const q of saved) {
        const query = q.query_string || '';
        items.push({
          kind: 'saved',
          id: `saved-${q.id || query}`,
          label: q.title || query,
          title: q.title,
          query,
          saved: q,
        });
      }
    }

    const historyItems = history
      .map((h) => {
        const query = h.query_string || h.query || '';
        return {
          kind: 'history' as const,
          id: `history-${h.id || h.hash || query}`,
          label: query,
          query,
        };
      })
      .filter((h) => !!h.query)
      .slice(0, HISTORY_LIMIT);

    if (historyItems.length) {
      items.push({
        kind: 'separator',
        id: 'sep-history',
        label: 'core.query-builder-history',
      });
      items.push(...historyItems);
    }

    return items;
  }

  onHintNavigate(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.hintHovered.update((v) => v + 1);
      event.preventDefault();
    }
    if (event.key === 'ArrowUp') {
      this.hintHovered.update((v) => v - 1);
      event.preventDefault();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
    }

    this.hintHovered.update((v) => Math.max(0, v));
    this.hintHovered.update((v) => Math.min(this.hints().length - 1, v));

    if (this.hints().length > 0) {
      document
        .querySelector(
          '.hints .hint:nth-of-type(' + (this.hintHovered() + 1) + ')',
        )
        ?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }
  }
  // Prepare string on filter change
  onSearchKeyDown(event: KeyboardEvent) {
    this.onHintNavigate(event);
  }
  onSearchKeyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab') {
      this.setHint(this.hints()[this.hintHovered()]);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      if (this.hints().length === 0) {
        this.onSearch();
      }
      if (this.hintHovered() >= 0) {
        this.setHint(this.hints()[this.hintHovered()]);
      }
      this.clearHints();
      event.preventDefault();
      setTimeout(() => {
        if (this.searchInput) {
          (<HTMLTextAreaElement>this.searchInput.first.nativeElement).focus();
        }
      }, 500);
      return;
    }
    if (event.key === 'Escape') {
      this.clearHints();
      event.preventDefault();
      return;
    }
    this.prevSelectionStart.set(
      (<HTMLTextAreaElement>event.target).selectionStart,
    );
    this.updateHint();
  }
  onInputClick(event: MouseEvent) {
    this.prevSelectionStart.set(
      (<HTMLTextAreaElement>event.target).selectionStart,
    );
    this.updateHint();
  }
  updateHint() {
    this.queryBuilderService
      .getHints(this.queryString(), this.prevSelectionStart())
      .subscribe((result) => {
        this.hintHovered.set(0);
        this.hints.set(result);
        this.loadedHints.set(result);
        this.hintTextString.set('');
        this.showTextInput.set(false);
        this.multipleSelectHint.set(false);

        if (
          this.prevContext &&
          this.prevContext.ruleIndex === OQLParser.RULE_value
        ) {
          this.showTextInput.set(
            this.queryBuilderService.getParamType(
              this.prevContext.parentCtx.start.text,
            ) === SearchParamType.TEXT ||
              this.queryBuilderService.getParamType(
                this.prevContext.parentCtx.start.text,
              ) === SearchParamType.DATE,
          );

          this.multipleSelectHint.set(
            this.queryBuilderService.getParamType(
              this.prevContext.parentCtx.start.text,
            ) === SearchParamType.LIST,
          );
        }

        if (
          this.prevContext &&
          this.prevContext.ruleIndex === OQLParser.RULE_value
        ) {
          result.forEach((hint) => {
            for (const value of this.prevContext.children) {
              if (value.getText() === `"${hint.data}"`) {
                hint.selected = true;
                return;
              }
            }
          });
        }
        if (this.prevContext && this.showTextInput) {
          this.hintTextString.set(this.prevContext.getText().slice(1, -1));
        }
        this.hints.set(result);
        this.loadedHints.set(result);
      });
  }
  selectHint(hint: SearchHint) {
    this.clearHints();
    this.setHint(hint);
  }
  onCheckboxClick(event: MouseEvent) {
    event.stopImmediatePropagation();
  }
  setHintValue() {
    const hint = {
      label: '',
      data: this.loadedHints()
        .filter((value) => value.selected)
        .map((value) => `"${value.data}"`)
        .join(', '),
      type: SearchHintType.RAW,
      start: 0,
      stop: 0,
    };

    if (
      this.prevContext &&
      this.prevContext.ruleIndex === OQLParser.RULE_value
    ) {
      hint.start = this.prevContext.start.start;
      hint.stop = this.prevContext.stop.stop + 1;
    }

    if (this.showTextInput) {
      hint.data = this.prevContext.getText();
    }

    this.setHint(hint);
  }
  clearHints() {
    this.hints.set([]);
  }
  setHint(hint: SearchHint) {
    this.hintDropdown?.closeDropdown();
    if (!hint) {
      return;
    }
    const hintResult = this.queryBuilderService.setHint(
      this.queryString(),
      hint,
      (<HTMLTextAreaElement>this.searchInput.first.nativeElement)
        .selectionStart,
    );
    if (hintResult) {
      this.queryString.set(hintResult.query.trimStart());
      this.cd.detectChanges();

      (<HTMLTextAreaElement>this.searchInput.first.nativeElement).value =
        hintResult.query.trimStart();
      (<HTMLTextAreaElement>(
        this.searchInput.first.nativeElement
      )).setSelectionRange(hintResult.position - 1, hintResult.position - 1);
      this.prevSelectionStart.set(hintResult.position - 1);
    }
    setTimeout(() => {
      this.updateHint();
      if (this.errors() === 0) {
        this.queryChange.next(this.queryString());
      }
    }, 100);
  }
  onSearch() {
    this.clearHints();
    this.queryChange.next(this.queryString());
  }
  setQueryString(queryString: string) {
    this.queryString.set(queryString ?? '');
    if (this.emitOnChange && this.errors() === 0) {
      this.queryChange.next(this.queryString());
    }
  }
}
