import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AsyncPipe } from '@angular/common';
import { EventEmitter, OnDestroy, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwDatePickerComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalService,
  RwModalSubHeaderDirective,
  RwSelectComponent,
  RwTextAreaComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import { ContainerD, Milestone, RwDataService } from '@renwu/core';

@Component({
  selector: 'renwu-projects-add-milestone',
  standalone: true,
  imports: [
    RwModalComponent,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwModalSubHeaderDirective,
    RwModalBodyDirective,
    RwButtonComponent,
    RwTextInputComponent,
    RwSelectComponent,
    RwTextAreaComponent,
    RwDatePickerComponent,
    RwCheckboxComponent,
    ReactiveFormsModule,
    AsyncPipe,
    TranslocoPipe
],
  templateUrl: './add-milestone.component.html',
  styleUrl: './add-milestone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddMilestoneComponent implements OnDestroy {
  @Output()
  closed = new EventEmitter<void>();
  @Output()
  added = new EventEmitter<Milestone>();

  dataService = inject(RwDataService);
  toast = inject(RwToastService);
  transloco = inject(TranslocoService);

  milestoneForm = new FormGroup({
    id: new FormControl(''),
    title: new FormControl('', {
      validators: [Validators.minLength(2), Validators.required],
    }),
    date: new FormControl(null),
    container: new FormControl<ContainerD>(null, {
      validators: [Validators.required],
    }),
    key: new FormControl(''),
    description: new FormControl(''),
    labels: new FormControl([]),
    archived: new FormControl(false),
    sort: new FormControl(Number.MAX_SAFE_INTEGER),
  });

  set milestone(value: Milestone) {
    this.milestoneForm.patchValue(value);
  }

  constructor(private modalService: RwModalService) {}

  ngOnDestroy() {
    this.closed.next();
    this.added.complete();
  }
  add() {
    this.added.next(this.milestoneForm.value as any);
  }
  closeModal() {
    this.modalService.close();
  }
  archive() {
    this.dataService
      .archiveMilestone(this.milestoneForm.value.id)
      .subscribe(() => {
        this.toast.success(
          this.transloco.translate('projects.milstone-archived'),
        );
        this.milestoneForm.patchValue({ archived: true });
      });
  }
  unarchive() {
    this.dataService
      .unarchiveMilestone(this.milestoneForm.value.id)
      .subscribe(() => {
        this.toast.success(
          this.transloco.translate('projects.milstone-unarchived'),
        );
        this.milestoneForm.patchValue({ archived: false });
      });
  }
}
