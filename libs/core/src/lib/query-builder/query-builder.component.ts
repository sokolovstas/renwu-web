import { NgTemplateOutlet } from '@angular/common';
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
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDropDownComponent,
  RwDropDownDirective,
  RwIconComponent,
} from '@renwu/components';
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
  SearchParamType,
} from '../search/search.model';

@Component({
  selector: 'renwu-query-builder',
  standalone: true,
  imports: [
    RwDropDownDirective,
    RwDropDownComponent,
    RwButtonComponent,
    FormsModule,
    RwIconComponent,
    RwCheckboxComponent,
    NgTemplateOutlet,
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

  @ViewChild('hintDropdown', { read: RwDropDownComponent, static: false })
  hintDropdown: RwDropDownComponent;

  @ViewChildren('searchInput')
  searchInput: QueryList<ElementRef>;

  hints = signal<Array<SearchHint>>([]);
  loadedHints = signal<Array<SearchHint>>([]);
  hintHovered = signal(-1);
  prevSelectionStart = signal(-1);
  prevContext: AtomContext;

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
  set query(value: string) {
    this.queryString.set(value);
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
        .scrollIntoView({ behavior: 'instant', block: 'nearest' });
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
    this.hintDropdown.closeDropdown();
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
    this.queryString.set(queryString);
  }
}
