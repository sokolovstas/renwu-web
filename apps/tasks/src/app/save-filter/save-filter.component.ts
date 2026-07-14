import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalService,
  RwTextInputComponent,
} from '@renwu/components';
import { SavedSearchQuery } from '@renwu/core';

@Component({
  selector: 'renwu-tasks-save-filter',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    RwModalComponent,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwButtonComponent,
    RwCheckboxComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './save-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveFilterComponent implements OnInit, OnDestroy {
  private readonly modalService = inject(RwModalService);

  @Input()
  filter: SavedSearchQuery | null = null;

  @Input()
  queryString = '';

  @Output()
  closed = new EventEmitter<void>();

  @Output()
  saved = new EventEmitter<SavedSearchQuery>();

  @Output()
  deleted = new EventEmitter<string>();

  filterForm = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    shared: new FormControl(false),
    channel: new FormControl(false),
  });

  ngOnInit(): void {
    this.filterForm.patchValue({
      title: this.filter?.title || '',
      shared: this.filter?.shared || false,
      channel: this.filter?.channel || false,
    });
  }

  ngOnDestroy(): void {
    this.closed.next();
    this.saved.complete();
    this.deleted.complete();
  }

  get canDelete(): boolean {
    return !!this.filter?.id;
  }

  save(): void {
    if (this.filterForm.invalid) {
      return;
    }
    const formValue = this.filterForm.getRawValue();
    this.saved.next({
      id: this.filter?.id,
      title: formValue.title,
      query_string: this.queryString,
      shared: formValue.shared,
      channel: formValue.channel,
    });
  }

  remove(): void {
    if (this.filter?.id) {
      this.deleted.next(this.filter.id);
    }
  }

  closeModal(): void {
    this.modalService.close();
  }
}
