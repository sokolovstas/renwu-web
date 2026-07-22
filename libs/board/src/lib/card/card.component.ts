import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ComponentRef,
  Component,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
  ViewContainerRef,
  inject,
} from '@angular/core';
import {
  Issue,
  IssueAssigneesComponent,
  IssueCardComponent,
  IssuePriorityComponent,
  IssueStatusComponent,
  IssueTypeComponent,
} from '@renwu/core';
import { ITaskCard, RW_BOARD_SETTINGS } from '../board.settings';

@Component({
  selector: 'renwu-boards-card',
  standalone: true,
  imports: [
    IssueAssigneesComponent,
    IssueCardComponent,
    IssuePriorityComponent,
    IssueStatusComponent,
    IssueTypeComponent,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements ITaskCard, AfterViewInit, OnChanges {
  @Input()
  issue: Issue;

  @Input()
  type: string;

  @Input()
  density = 'normal';

  @Input()
  colorMode = 'status';

  private settings = inject(RW_BOARD_SETTINGS);
  private viewContainerRef = inject(ViewContainerRef);
  private cd = inject(ChangeDetectorRef);
  private cardRef: ComponentRef<ITaskCard>;
  private initialized = false;
  private renderedType: string;
  hasCustomComponent = false;

  @HostBinding('class')
  get hostClass(): string {
    return `renwu-boards-card renwu-boards-card--${this.type || 'empty'} renwu-boards-card--${this.density}`;
  }

  get color(): string {
    if (this.colorMode === 'priority') {
      return this.issue?.priority?.color || 'var(--gray-400)';
    }
    if (this.colorMode === 'type') {
      return this.issue?.type?.color || 'var(--gray-400)';
    }
    return this.issue?.status?.color || 'var(--gray-400)';
  }

  get completion(): number {
    const value = Number(this.issue?.completion ?? 0);
    return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  }

  get isEmptyType(): boolean {
    return !this.type;
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    this.renderCard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }
    if (changes['type']) {
      this.renderCard();
      return;
    }
    if (changes['issue'] && this.cardRef) {
      this.cardRef.instance.issue = this.issue;
      this.cardRef.changeDetectorRef.markForCheck();
    }
  }

  private renderCard(): void {
    if (!this.type) {
      this.viewContainerRef.clear();
      this.cardRef = undefined;
      this.renderedType = undefined;
      this.hasCustomComponent = false;
      this.cd.markForCheck();
      return;
    }
    const component =
      this.settings.components[this.type] ?? this.settings.components['default'];
    if (!component) {
      this.viewContainerRef.clear();
      this.cardRef = undefined;
      this.renderedType = undefined;
      this.hasCustomComponent = false;
      this.cd.markForCheck();
      return;
    }
    this.hasCustomComponent = true;
    if (this.cardRef && this.renderedType === this.type) {
      this.cardRef.instance.issue = this.issue;
      this.cardRef.changeDetectorRef.markForCheck();
      return;
    }
    this.viewContainerRef.clear();
    this.cardRef = this.viewContainerRef.createComponent(component);
    this.cardRef.instance.issue = this.issue;
    this.renderedType = this.type;
    this.cd.markForCheck();
  }
}
