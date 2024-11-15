import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwCheckboxComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
} from '@renwu/components';
import {
  Container,
  ExternalUserScope,
  UniqueContainerKeyValidator,
  WorkflowD,
} from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-settings',
  standalone: true,
  imports: [
    AsyncPipe,
    RenwuPageComponent,
    ReactiveFormsModule,
    RwSelectComponent,
    RwButtonComponent,
    RwCheckboxComponent,
    RwTimePickerComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  destroy = inject(DestroyRef);
  currentProject = this.projectService.currentProject;
  settingsForm = new FormGroup(
    {
      id: new FormControl(''),
      archived: new FormControl(false),
      title: new FormControl('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      key: new FormControl('', {
        updateOn: 'change',
        validators: [Validators.required, Validators.minLength(2)],
      }),
      settings: new FormGroup({
        workflow: new FormControl(null as WorkflowD),
        external_user_scope: new FormControl<ExternalUserScope>(
          ExternalUserScope.SELF,
        ),
        min_autolog_time: new FormControl(0),
        auto_scheduling: new FormControl(true),
      }),
    },
    {
      asyncValidators: [
        this.containerKeyValidator.validate.bind(this.containerKeyValidator),
      ],
    },
  );
  constructor(
    private projectService: ProjectService,
    private containerKeyValidator: UniqueContainerKeyValidator,
    private route: ActivatedRoute,
    private router: Router,
  ) {}
  ngOnInit() {
    this.projectService.currentProject
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((c) => {
        this.settingsForm.reset();
        this.settingsForm.patchValue(c);
      });
  }

  async save() {
    const newKey =
      this.currentProject.getValue().key !== this.settingsForm.value.key
        ? this.settingsForm.value.key
        : '';
    await firstValueFrom(
      this.projectService.saveSettings(this.settingsForm.value as Container),
    );
    if (newKey) {
      this.router.navigate(['../..', newKey, 'settings'], {
        relativeTo: this.route,
      });
    }
  }
  async remove() {
    const del = await firstValueFrom(
      this.projectService.removeProject(this.currentProject.getValue()),
    );
    if (del !== null) {
      this.router.navigate(['../..'], {
        relativeTo: this.route,
      });
    }
  }
}
