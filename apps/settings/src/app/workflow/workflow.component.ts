import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import {
  IssueStatusComponent,
  RwContainerService,
  RwDataService,
  Status,
  WorkflowTransition,
} from '@renwu/core';
import mermaid from 'mermaid';
import {
  debounceTime,
  lastValueFrom,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

type GroupedTransition = FormGroup<{
  step: FormControl<Status>;
  tos: FormArray<
    FormGroup<{ to: FormControl<Status>; label: FormControl<string> }>
  >;
}>;
type GroupedTransitions = FormArray<GroupedTransition>;

@Component({
  selector: 'renwu-settings-workflow',
  standalone: true,
  imports: [
    RenwuPageComponent,
    RwButtonComponent,
    AsyncPipe,
    RwTextInputComponent,
    RwSelectComponent,
    IssueStatusComponent,
    ReactiveFormsModule,
    TranslocoPipe,
  ],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
  hostDirectives: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowComponent implements AfterViewInit {
  route = inject(ActivatedRoute);
  dataService = inject(RwDataService);
  toastService = inject(RwToastService);
  formBuilder = inject(FormBuilder);
  containerService = inject(RwContainerService);
  statuses = Array.from(this.containerService.statusMap.values());
  workflow = this.route.paramMap.pipe(
    map((p) => p.get('id')),
    switchMap((id) => this.dataService.getWorkflow(id)),
    tap((d) => {
      const nnfb = this.formBuilder.nonNullable;
      const gropedTransitions = Array.from(
        this.containerService.statusMap.values(),
      ).map((v) => {
        return nnfb.group({
          step: nnfb.control(v),
          tos: nnfb.array(
            d.transitions
              .filter((t) => t.step.id === v.id)
              .map((t) =>
                nnfb.group({
                  label: nnfb.control(t.label),
                  to: nnfb.control(t.to),
                }),
              ) || [],
          ),
        });
      });

      this.workflowForm.controls.id.patchValue(d.id);
      this.workflowForm.controls.title.patchValue(d.title);
      this.workflowForm.controls.description.patchValue(d.description);

      this.workflowForm.controls.gropedTransitions.clear();
      gropedTransitions.forEach((t) =>
        this.workflowForm.controls.gropedTransitions.insert(
          Number.MAX_VALUE,
          t,
        ),
      );
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );
  workflowForm = new FormGroup({
    id: new FormControl(''),
    title: new FormControl(''),
    description: new FormControl(''),
    gropedTransitions: new FormArray<GroupedTransition>([]),
  });
  ngAfterViewInit() {
    this.workflowForm.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(async (v) => {
        mermaid.init({
          themeCSS: `
            .edgeLabel {
              background-color: var(--white);
              text-align: center;
              color: var(--black);
            }
            .node rect {
              fill: var(--white) !important;
              rx: 20px;
              ry: 20px;
            }
            .marker {
              fill: var(--gray-400) !important;
              stroke: var(--gray-400) !important;
            }
            .flowchart-link {
              stroke: var(--gray-400) !important;
            }
        `,
        });
        const element = document.querySelector('#workflowGraph');
        let graphDefinition = 'graph TB\n';
        this.workflowForm.value.gropedTransitions.forEach((value) => {
          value.tos.forEach((t) => {
            graphDefinition += `${value.step.id}(${value.step.label})-->|${
              t.label || t.to.label
            }|${t.to.id}(${t.to.label})\n`;
          });
          graphDefinition += `style ${value.step.id} stroke:${value.step.color},color:${value.step.color},stroke-width:2px\n`;
          value.step;
        });
        graphDefinition += `linkStyle default stroke: white\n`;

        const { svg, bindFunctions } = await mermaid.render(
          'temp',
          graphDefinition,
        );
        element.innerHTML = svg;
      });
  }
  get groupedTransitions() {
    return (
      this.workflowForm.controls['gropedTransitions'] as GroupedTransitions
    ).controls;
  }
  addStep(status: GroupedTransition) {
    const nnfb = this.formBuilder.nonNullable;
    status.controls.tos.insert(
      -1,
      nnfb.group({
        label: nnfb.control(''),
        to: nnfb.control(null),
      }),
    );
  }
  removeStep(status: GroupedTransition, index: number) {
    status.controls.tos.removeAt(index);
  }
  async save() {
    const transitions = this.workflowForm.value.gropedTransitions.reduce(
      (acc, value) => {
        value.tos.forEach((t) => {
          acc.push({ label: t.label, step: value.step, to: t.to });
        });
        value.step;
        return acc;
      },
      [] as WorkflowTransition[],
    );
    await lastValueFrom(
      this.dataService.saveWorkflow(this.workflowForm.value.id, {
        id: this.workflowForm.value.id,
        title: this.workflowForm.value.title,
        description: this.workflowForm.value.description,
        transitions: transitions,
      }),
    );
    this.toastService.success('Workflow saved');
  }
}
