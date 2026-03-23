import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { RenwuTourAnchorDirective } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalFooterDirective,
  RwModalService,
  RwSelectComponent,
  RwTextInputComponent
} from '@renwu/components';
import {
  Container,
  ExternalUserScope,
  UniqueContainerKeyValidator,
} from '@renwu/core';

@Component({
  selector: 'renwu-projects-add-project',
  standalone: true,
  imports: [
    AsyncPipe,
    RwModalComponent,
    RwModalBodyDirective,
    RwModalFooterDirective,
    RwModalBodyDirective,
    RwButtonComponent,
    RwTextInputComponent,
    RwSelectComponent,
    ReactiveFormsModule,
    RenwuTourAnchorDirective,
    TranslocoPipe,
  ],
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProjectComponent implements OnDestroy {
  private uniqueContainerKey = inject(UniqueContainerKeyValidator);
  private modalService = inject(RwModalService);

  @Output()
  closed = new EventEmitter<void>();
  @Output()
  added = new EventEmitter<Container>();

  projectForm = new FormGroup(
    {
      title: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.minLength(2), Validators.required],
      }),
      key: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.minLength(2), Validators.required],
      }),
      settings: new FormGroup({
        external_user_scope: new FormControl<ExternalUserScope>(
          ExternalUserScope.SELF,
          {
            updateOn: 'change',
            validators: [Validators.minLength(2), Validators.required],
          },
        ),
      }),
    },
    {
      asyncValidators: [
        this.uniqueContainerKey.validate.bind(this.uniqueContainerKey),
      ],
    },
  );

  ngOnDestroy() {
    this.closed.next();
    this.added.complete();
  }
  add() {
    this.added.next(this.projectForm.value as any);
  }
  closeModal() {
    this.modalService.close();
  }
}
