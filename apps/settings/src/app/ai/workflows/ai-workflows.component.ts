import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ISelectItem,
  RwAlertService,
  RwButtonComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
  SelectModelBase,
} from '@renwu/components';
import { AIWorkflow, AIWorkflowStep, RwDataService } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-settings-ai-workflows',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RwButtonComponent,
    RwSelectComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './ai-workflows.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWorkflowsComponent {
  private readonly data = inject(RwDataService);
  private readonly alert = inject(RwAlertService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly stepModels = new Map<string, SelectModelBase<string>>();
  private promptPresets: Record<string, string> = {};

  readonly items = signal<AIWorkflow[]>([]);
  readonly containerModel = this.createModel();
  readonly workspaceModel = this.createModel();
  private containerOptions: ISelectItem<string>[] = [];
  private workspaceOptions: ISelectItem<string>[] = [];
  private skillOptions: ISelectItem<string>[] = [];
  private statusOptions: ISelectItem<string>[] = [];

  readonly form = new FormGroup({
    id: new FormControl<string | undefined>(undefined),
    name: new FormControl('', { nonNullable: true }),
    container_id: new FormControl('', { nonNullable: true }),
    workspace_id: new FormControl('', { nonNullable: true }),
    enabled: new FormControl(true, { nonNullable: true }),
    steps: new FormArray<FormGroup>([]),
  });

  get steps(): FormArray<FormGroup> {
    return this.form.controls.steps;
  }

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [workflows, containers, workspaces, skills, statuses, presets] =
        await Promise.all([
          firstValueFrom(this.data.aiListWorkflows().pipe(defaultIfEmpty([]))),
          firstValueFrom(this.data.getContainers({}).pipe(defaultIfEmpty([]))),
          firstValueFrom(this.data.aiListWorkspaces().pipe(defaultIfEmpty([]))),
          firstValueFrom(this.data.aiListSkills().pipe(defaultIfEmpty([]))),
          firstValueFrom(this.data.getIssueStatus({}).pipe(defaultIfEmpty([]))),
          firstValueFrom(
            this.data.aiPromptPresets().pipe(defaultIfEmpty({})),
          ),
        ]);
      this.promptPresets = presets ?? {};
      this.items.set(workflows ?? []);
      this.containerOptions = (containers ?? []).map((x) =>
        this.option(
          x.id,
          x.key ? `${x.key}${x.title ? ` — ${x.title}` : ''}` : x.title || x.id,
        ),
      );
      this.workspaceOptions = (workspaces ?? []).map((x) =>
        this.option(x.id, x.name || x.workdir || x.id),
      );
      this.skillOptions = (skills ?? []).map((x) =>
        this.option(x.id, x.name || x.slug || x.id),
      );
      this.statusOptions = (statuses ?? []).map((x) =>
        this.option(x.id, x.label || x.id),
      );
      this.containerModel.staticData = this.containerOptions;
      this.workspaceModel.staticData = this.workspaceOptions;
      this.syncStepModels();
      // Re-apply values so rw-select resolves labels from updated staticData.
      this.form.patchValue({
        container_id: this.form.controls.container_id.value,
        workspace_id: this.form.controls.workspace_id.value,
      });
      for (const step of this.steps.controls) {
        step.patchValue(step.getRawValue());
      }
    } finally {
      this.cd.markForCheck();
    }
  }

  edit(item?: AIWorkflow): void {
    this.steps.clear();
    this.stepModels.clear();
    for (const step of item?.steps || []) this.steps.push(this.step(step));
    this.syncStepModels();
    this.form.reset({ enabled: true, ...(item || {}) });
    this.cd.markForCheck();
  }

  addStep(): void {
    this.steps.push(this.step());
    this.syncStepModels();
    this.cd.markForCheck();
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.stepModels.clear();
    this.syncStepModels();
    this.cd.markForCheck();
  }

  insertStepPromptPreset(index: number): void {
    const step = this.steps.at(index);
    const delivery = !!step.controls['delivery'].value;
    const key = delivery ? 'delivery' : 'grooming';
    const text = this.promptPresets[key] || '';
    if (!text) {
      return;
    }
    step.controls['prompt_template'].setValue(text);
    step.controls['prompt_template'].markAsDirty();
    this.cd.markForCheck();
  }

  insertStepFollowupPreset(index: number): void {
    const step = this.steps.at(index);
    const delivery = !!step.controls['delivery'].value;
    const key = delivery ? 'delivery_followup' : 'grooming_followup';
    const text = this.promptPresets[key] || '';
    if (!text) {
      return;
    }
    step.controls['followup_template'].setValue(text);
    step.controls['followup_template'].markAsDirty();
    this.cd.markForCheck();
  }

  insertStepResolvePreset(index: number): void {
    const step = this.steps.at(index);
    const text = this.promptPresets['resolve_repository'] || '';
    if (!text) {
      return;
    }
    step.controls['resolve_repository_template'].setValue(text);
    step.controls['resolve_repository_template'].markAsDirty();
    this.cd.markForCheck();
  }

  stepSkillModel(index: number): SelectModelBase<string> {
    return this.stepModel(`skill:${index}`, this.skillOptions);
  }

  stepStatusModel(index: number, field: string): SelectModelBase<string> {
    return this.stepModel(`${field}:${index}`, this.statusOptions);
  }

  readonly requireGatesPassModel = (() => {
    const m = new SelectModelBase<string>();
    m.allowNull = true;
    m.loadSelected = true;
    return m;
  })();

  requireGatesPassModelFor(_index: number): SelectModelBase<string> {
    this.requireGatesPassModel.staticData = [
      {
        id: '',
        label: this.transloco.translate('settings.ai-require-gates-default'),
      },
      {
        id: 'true',
        label: this.transloco.translate('settings.ai-require-gates-true'),
      },
      {
        id: 'false',
        label: this.transloco.translate('settings.ai-require-gates-false'),
      },
    ];
    return this.requireGatesPassModel;
  }

  async save(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const raw = this.form.getRawValue();
    const steps = (raw.steps as Array<Record<string, unknown>>).map((s) => {
      const flag = s['require_gates_pass'];
      const require_gates_pass =
        flag === 'true' ? true : flag === 'false' ? false : undefined;
      return { ...s, require_gates_pass } as AIWorkflowStep;
    });
    const saved = await firstValueFrom(
      this.data
        .aiSaveWorkflow({ ...raw, steps })
        .pipe(defaultIfEmpty(null)),
    );
    if (!saved) {
      return;
    }
    this.toast.success(this.transloco.translate('settings.ai-saved'));
    this.edit(saved);
    await this.load();
  }

  async remove(item: AIWorkflow): Promise<void> {
    if (!item.id || !(await this.confirm())) return;
    await firstValueFrom(
      this.data.aiDeleteWorkflow(item.id).pipe(defaultIfEmpty(null)),
    );
    this.toast.success(this.transloco.translate('settings.ai-deleted'));
    if (this.form.controls.id.value === item.id) this.edit();
    await this.load();
  }

  private step(value?: AIWorkflowStep): FormGroup {
    return new FormGroup({
      id: new FormControl(value?.id),
      on_enter_status_id: new FormControl(value?.on_enter_status_id || '', {
        nonNullable: true,
      }),
      skill_id: new FormControl(value?.skill_id || '', { nonNullable: true }),
      auto_transit: new FormControl(value?.auto_transit || false, {
        nonNullable: true,
      }),
      on_success_status_id: new FormControl(value?.on_success_status_id || '', {
        nonNullable: true,
      }),
      on_need_info_status_id: new FormControl(
        value?.on_need_info_status_id || '',
        { nonNullable: true },
      ),
      on_failure_status_id: new FormControl(value?.on_failure_status_id || '', {
        nonNullable: true,
      }),
      retrigger: new FormControl(value?.retrigger || false, {
        nonNullable: true,
      }),
      delivery: new FormControl(value?.delivery || false, {
        nonNullable: true,
      }),
      run_gates_after: new FormControl(value?.run_gates_after || false, {
        nonNullable: true,
      }),
      // '' = default (block under enforce), 'true', 'false' = opt-out
      require_gates_pass: new FormControl(
        value?.require_gates_pass === true
          ? 'true'
          : value?.require_gates_pass === false
            ? 'false'
            : '',
        { nonNullable: true },
      ),
      max_retrigger: new FormControl(value?.max_retrigger || 0, {
        nonNullable: true,
      }),
      on_retrigger_exhausted_status_id: new FormControl(
        value?.on_retrigger_exhausted_status_id || '',
        { nonNullable: true },
      ),
      on_blocking_status_id: new FormControl(
        value?.on_blocking_status_id || '',
        { nonNullable: true },
      ),
      prompt_template: new FormControl(value?.prompt_template || '', {
        nonNullable: true,
      }),
      followup_template: new FormControl(value?.followup_template || '', {
        nonNullable: true,
      }),
      resolve_repository_template: new FormControl(
        value?.resolve_repository_template || '',
        { nonNullable: true },
      ),
    });
  }

  private createModel(): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.allowNull = true;
    model.loadSelected = true;
    return model;
  }

  private stepModel(
    key: string,
    options: ISelectItem<string>[],
  ): SelectModelBase<string> {
    let model = this.stepModels.get(key);
    if (!model) {
      model = this.createModel();
      this.stepModels.set(key, model);
    }
    model.staticData = options;
    return model;
  }

  private syncStepModels(): void {
    for (let i = 0; i < this.steps.length; i++) {
      this.stepSkillModel(i);
      this.stepStatusModel(i, 'enter');
      this.stepStatusModel(i, 'success');
      this.stepStatusModel(i, 'need_info');
      this.stepStatusModel(i, 'failure');
      this.stepStatusModel(i, 'blocking');
      this.stepStatusModel(i, 'retrigger_exhausted');
    }
  }

  private option(
    id: string | undefined,
    label: string | undefined,
  ): ISelectItem<string> {
    return { id: String(id ?? ''), label: label || String(id ?? '') };
  }

  private async confirm(): Promise<boolean> {
    const result = await firstValueFrom(
      this.alert.confirm(
        this.transloco.translate('settings.ai-delete-title'),
        this.transloco.translate('settings.ai-delete-text'),
        true,
        this.transloco.translate('settings.delete'),
        this.transloco.translate('core.cancel'),
      ),
    );
    return !!result?.affirmative;
  }
}
