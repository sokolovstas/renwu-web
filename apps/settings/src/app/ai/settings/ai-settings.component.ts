import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ISelectItem,
  RwButtonComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
  SelectModelBase,
} from '@renwu/components';
import { AIProviderInfo, AISettings, RwDataService, UserType } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

type PromptField =
  | 'prompt_template'
  | 'grooming_followup_template'
  | 'delivery_template'
  | 'delivery_followup_template'
  | 'resolve_repository_template';

@Component({
  selector: 'renwu-settings-ai-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RwButtonComponent,
    RwSelectComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './ai-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSettingsComponent {
  private readonly data = inject(RwDataService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly actorModel = new SelectModelBase<string>();
  readonly modelModel = new SelectModelBase<string>();
  readonly providerModel = new SelectModelBase<string>();
  providers: AIProviderInfo[] = [];

  /** Filled from API ApplyPromptDefaults on first load — used by Reset. */
  private resetBaselines: Record<PromptField, string> = {
    prompt_template: '',
    grooming_followup_template: '',
    delivery_template: '',
    delivery_followup_template: '',
    resolve_repository_template: '',
  };
  private baselinesReady = false;

  readonly promptFields: {
    field: PromptField;
    labelKey: string;
    hintKey: string;
  }[] = [
    {
      field: 'prompt_template',
      labelKey: 'settings.ai-prompt-grooming',
      hintKey: 'settings.ai-prompt-grooming-hint',
    },
    {
      field: 'grooming_followup_template',
      labelKey: 'settings.ai-prompt-grooming-followup',
      hintKey: 'settings.ai-prompt-grooming-followup-hint',
    },
    {
      field: 'delivery_template',
      labelKey: 'settings.ai-prompt-delivery',
      hintKey: 'settings.ai-prompt-delivery-hint',
    },
    {
      field: 'delivery_followup_template',
      labelKey: 'settings.ai-prompt-delivery-followup',
      hintKey: 'settings.ai-prompt-delivery-followup-hint',
    },
    {
      field: 'resolve_repository_template',
      labelKey: 'settings.ai-prompt-resolve-repo',
      hintKey: 'settings.ai-prompt-resolve-repo-hint',
    },
  ];

  readonly form = new FormGroup({
    enabled: new FormControl(false, { nonNullable: true }),
    agent_provider: new FormControl('opencode', { nonNullable: true }),
    agent_base_url: new FormControl('', { nonNullable: true }),
    agent_web_base_url: new FormControl('', { nonNullable: true }),
    actor_user_id: new FormControl('', { nonNullable: true }),
    default_model: new FormControl('', { nonNullable: true }),
    max_concurrent_jobs: new FormControl(1, { nonNullable: true }),
    prompt_template: new FormControl('', { nonNullable: true }),
    grooming_followup_template: new FormControl('', { nonNullable: true }),
    delivery_template: new FormControl('', { nonNullable: true }),
    delivery_followup_template: new FormControl('', { nonNullable: true }),
    resolve_repository_template: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.actorModel.allowNull = true;
    this.actorModel.loadSelected = true;
    this.modelModel.allowNull = true;
    this.modelModel.loadSelected = true;
    this.providerModel.allowNull = false;
    this.providerModel.loadSelected = true;
    void this.load();
  }

  get selectedProvider(): AIProviderInfo | undefined {
    const id = this.form.controls.agent_provider.value;
    return this.providers.find((p) => p.id === id);
  }

  async load(): Promise<void> {
    try {
      const [settings, users, providersResp] = await Promise.all([
        firstValueFrom(this.data.aiLoadSettings().pipe(defaultIfEmpty(null))),
        firstValueFrom(
          this.data
            .getUsers({ type: [UserType.DUMMY] })
            .pipe(defaultIfEmpty([])),
        ),
        firstValueFrom(
          this.data.aiListProviders().pipe(defaultIfEmpty({ providers: [] })),
        ),
      ]);
      this.providers = providersResp?.providers || [];
      this.providerModel.staticData = this.providers.map((p) =>
        this.option(p.id, p.label || p.id),
      );
      this.actorModel.staticData = (users || []).map((u) =>
        this.option(u.id || '', u.full_name || u.username || u.id || ''),
      );
      this.patchPromptSettings(settings || {}, true);
      await this.loadModels();
      this.form.markAsPristine();
    } finally {
      this.cd.markForCheck();
    }
  }

  resetPrompt(field: PromptField): void {
    this.form.controls[field].setValue(this.resetBaselines[field] || '');
    this.form.controls[field].markAsDirty();
    this.cd.markForCheck();
  }

  resetAllPrompts(): void {
    for (const field of this.promptFields.map((p) => p.field)) {
      this.form.controls[field].setValue(this.resetBaselines[field] || '');
      this.form.controls[field].markAsDirty();
    }
    this.cd.markForCheck();
  }

  async loadModels(): Promise<void> {
    const baseUrl =
      this.form.controls.agent_base_url.value?.trim() || undefined;
    const provider =
      this.form.controls.agent_provider.value?.trim() || undefined;
    const response = await firstValueFrom(
      this.data
        .aiListAgentModels(baseUrl, provider)
        .pipe(defaultIfEmpty({ models: [] })),
    );
    const models = response?.models || [];
    this.modelModel.staticData = models.map((m) =>
      this.option(m.id, m.label || m.id),
    );
    const current = this.form.controls.default_model.value;
    if (current && !this.modelModel.staticData.some((x) => x.id === current)) {
      this.modelModel.staticData = [
        this.option(current, current),
        ...this.modelModel.staticData,
      ];
    }
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      const raw = this.form.getRawValue();
      const payload: AISettings = {
        ...raw,
        // Keep legacy fields in sync for older clients / jobs UI.
        opencode_base_url: raw.agent_base_url,
        opencode_web_base_url: raw.agent_web_base_url,
      };
      const settings = await firstValueFrom(
        this.data.aiSaveSettings(payload).pipe(defaultIfEmpty(null)),
      );
      if (!settings) {
        return;
      }
      this.patchPromptSettings(settings, false);
      this.form.markAsPristine();
      this.toast.success(this.transloco.translate('settings.ai-saved'));
    } finally {
      this.cd.markForCheck();
    }
  }

  private patchPromptSettings(
    settings: AISettings,
    captureBaselines: boolean,
  ): void {
    const prompts: Record<PromptField, string> = {
      prompt_template: settings.prompt_template?.trim() || '',
      grooming_followup_template:
        settings.grooming_followup_template?.trim() || '',
      delivery_template: settings.delivery_template?.trim() || '',
      delivery_followup_template:
        settings.delivery_followup_template?.trim() || '',
      resolve_repository_template:
        settings.resolve_repository_template?.trim() || '',
    };
    if (captureBaselines && !this.baselinesReady) {
      // API fills built-in defaults for empty fields — keep as Reset targets.
      this.resetBaselines = { ...prompts };
      this.baselinesReady = true;
    }
    const baseUrl =
      settings.agent_base_url || settings.opencode_base_url || '';
    const webUrl =
      settings.agent_web_base_url || settings.opencode_web_base_url || '';
    this.form.patchValue({
      ...settings,
      ...prompts,
      agent_provider: settings.agent_provider || 'opencode',
      agent_base_url: baseUrl,
      agent_web_base_url: webUrl,
    });
  }

  private option(id: string, label: string): ISelectItem<string> {
    return { id, label };
  }
}
