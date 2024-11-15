import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwSelectComponent,
  RwTextAreaComponent,
  RwTextInputComponent,
  RwTimePickerComponent,
} from '@renwu/components';
import { Priority, Status, Type } from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from '../project.service';

@Component({
  selector: 'renwu-projects-template',
  standalone: true,
  imports: [
    AsyncPipe,
    RenwuPageComponent,
    ReactiveFormsModule,
    RwTextAreaComponent,
    RwTextInputComponent,
    RwTimePickerComponent,
    RwButtonComponent,
    RwSelectComponent,
    TranslocoPipe,
  ],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateComponent implements OnInit {
  destroy = inject(DestroyRef);
  currentProject = this.projectService.currentProject;
  taskForm = new FormGroup({
    type: new FormControl<Type>(null),
    priority: new FormControl<Priority>(null),
    status: new FormControl<Status>(null),
    estimated_time: new FormControl(4 * 60 * 60),
  });
  constructor(private projectService: ProjectService) {}
  ngOnInit(): void {
    this.projectService.currentProject
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((c) => {
        this.taskForm.reset();
        this.taskForm.patchValue(c.settings.issue);
      });
  }

  async save() {
    await firstValueFrom(this.projectService.saveTemplate(this.taskForm.value));
  }
}
