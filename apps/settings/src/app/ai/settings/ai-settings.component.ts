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
import { AIProviderInfo, AIProviderSettings, AISettings, RwDataService, UserType } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

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
  /** Suppress provider→models reload while patching form from API. */
  private suppressProviderReload = false;

  readonly actorModel = new SelectModelBase<string>();
  readonly modelModel = new SelectModelBase<string>();
  readonly providerModel = new SelectModelBase<string>();
  providers: AIProviderInfo[] = [];
  private lastProvider = '';
  private readonly providerDrafts: Record<string, ProviderDraft> = {};

  readonly gatesModeModel = new SelectModelBase<string>();
  readonly effortModel = new SelectModelBase<string>();
  readonly form = new FormGroup({
    enabled: new FormControl(false, { nonNullable: true }),
    run_via_runner: new FormControl(false, { nonNullable: true }),
    agent_provider: new FormControl('opencode', { nonNullable: true }),
    agent_base_url: new FormControl('', { nonNullable: true }),
    agent_web_base_url: new FormControl('', { nonNullable: true }),
    actor_user_id: new FormControl('', { nonNullable: true }),
    default_model: new FormControl('', { nonNullable: true }),
    default_effort: new FormControl('', { nonNullable: true }),
    max_concurrent_jobs: new FormControl(10, { nonNullable: true }),
    gates_mode: new FormControl<'shadow' | 'enforce'>('shadow', {
      nonNullable: true,
    }),
    max_fix_iterations: new FormControl(0, { nonNullable: true }),
    lock_wait_timeout_sec: new FormControl(0, { nonNullable: true }),
    gate_timeout_sec: new FormControl(0, { nonNullable: true }),
  });

  constructor() {
    this.actorModel.allowNull = true;
    this.actorModel.loadSelected = true;
    this.modelModel.allowNull = true;
    this.modelModel.loadSelected = true;
    this.providerModel.allowNull = false;
    this.providerModel.loadSelected = true;
    this.gatesModeModel.allowNull = false;
    this.gatesModeModel.loadSelected = true;
    this.effortModel.allowNull = true;
    this.effortModel.loadSelected = true;
    this.effortModel.staticData = this.effortOptions(false);
    this.gatesModeModel.staticData = [
      {
        id: 'shadow',
        label: this.transloco.translate('settings.ai-gates-mode-shadow'),
      },
      {
        id: 'enforce',
        label: this.transloco.translate('settings.ai-gates-mode-enforce'),
      },
    ];
    this.form.controls.agent_provider.valueChanges.subscribe((id) => {
      if (this.suppressProviderReload) {
        return;
      }
      void this.onProviderChanged(id);
    });
    void this.load();
  }

  private async onProviderChanged(nextId: string): Promise<void> {
    this.stashProviderDraft(this.lastProvider);
    this.lastProvider = nextId || 'opencode';
    this.applyProviderDraft(this.lastProvider);
    this.syncRunnerRequirement();
    await this.loadModels({
      dropUnknown: true,
      preferredModel: this.form.controls.default_model.value,
    });
    this.cd.markForCheck();
  }

  get selectedProvider(): AIProviderInfo | undefined {
    const id = this.form.controls.agent_provider.value;
    return this.providers.find((p) => p.id === id);
  }

  get runnerRequired(): boolean {
    return this.selectedProvider?.needs_runner === true;
  }

  get effortVisible(): boolean {
    return this.selectedProvider?.needs_effort === true;
  }

  private syncRunnerRequirement(): void {
    const ctl = this.form.controls.run_via_runner;
    if (this.runnerRequired) {
      ctl.setValue(true);
      ctl.disable({ emitEvent: false });
      return;
    }
    if (ctl.disabled) {
      ctl.enable({ emitEvent: false });
    }
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

      const provider = settings?.agent_provider || 'opencode';
      const baseUrl =
        settings?.agent_base_url || settings?.opencode_base_url || '';
      const savedModel = settings?.default_model?.trim() || '';

      // Catalog first, then form value — otherwise rw-select keeps an empty label.
      await this.loadModels({
        provider,
        baseUrl,
        preferredModel: savedModel,
        dropUnknown: true,
      });
      this.patchSettings(settings || {});
      this.rebindSelects();
      if (!this.form.dirty) {
        this.form.markAsPristine();
      }
    } finally {
      this.cd.markForCheck();
    }
  }

  async loadModels(opts?: {
    dropUnknown?: boolean;
    preferredModel?: string;
    provider?: string;
    baseUrl?: string;
  }): Promise<void> {
    const provider =
      opts?.provider?.trim() ||
      this.form.controls.agent_provider.value?.trim() ||
      undefined;
    const providerInfo = this.providers.find((p) => p.id === provider);
    const baseUrl =
      providerInfo?.needs_base_url === false
        ? undefined
        : opts?.baseUrl?.trim() ||
          this.form.controls.agent_base_url.value?.trim() ||
          undefined;
    const response = await firstValueFrom(
      this.data
        .aiListAgentModels(baseUrl, provider)
        .pipe(defaultIfEmpty({ models: [] })),
    );
    const models = response?.models || [];
    this.modelModel.staticData = models.map((m) =>
      this.option(m.id, m.label || m.id),
    );

    let next =
      opts?.preferredModel?.trim() ||
      this.form.controls.default_model.value?.trim() ||
      '';
    const known = this.modelModel.staticData.some((x) => x.id === next);
    if (next && !known) {
      if (opts?.dropUnknown || providerInfo?.needs_runner) {
        next = String(this.modelModel.staticData[0]?.id ?? '');
        this.form.controls.default_model.setValue(next);
        this.form.controls.default_model.markAsDirty();
      } else {
        this.modelModel.staticData = [
          this.option(next, next),
          ...this.modelModel.staticData,
        ];
      }
    }

    // Force rw-select to resolve label from the new staticData.
    this.form.controls.default_model.setValue(next || '');
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      this.stashProviderDraft(this.form.controls.agent_provider.value);
      const raw = this.form.getRawValue();
      const payload: AISettings = {
        ...raw,
        opencode_base_url: raw.agent_base_url,
        opencode_web_base_url: raw.agent_web_base_url,
        providers: this.providersPayload(raw.agent_provider),
      };
      const settings = await firstValueFrom(
        this.data.aiSaveSettings(payload).pipe(defaultIfEmpty(null)),
      );
      if (!settings) {
        return;
      }
      await this.loadModels({
        preferredModel: settings.default_model,
        provider: settings.agent_provider,
        baseUrl: settings.agent_base_url || settings.opencode_base_url,
        dropUnknown: true,
      });
      this.patchSettings(settings);
      this.rebindSelects();
      this.form.markAsPristine();
      this.toast.success(this.transloco.translate('settings.ai-saved'));
    } finally {
      this.cd.markForCheck();
    }
  }

  private patchSettings(settings: AISettings): void {
    this.loadProviderDrafts(settings);
    const provider = settings.agent_provider || 'opencode';
    const draft = this.providerDrafts[provider] || this.emptyDraft();
    this.suppressProviderReload = true;
    try {
      this.form.patchValue({
        enabled: !!settings.enabled,
        run_via_runner: draft.run_via_runner,
        agent_provider: provider,
        agent_base_url: draft.agent_base_url,
        agent_web_base_url: draft.agent_web_base_url,
        actor_user_id: settings.actor_user_id || '',
        default_model: draft.default_model || settings.default_model || '',
        default_effort: draft.default_effort || settings.default_effort || '',
        max_concurrent_jobs: settings.max_concurrent_jobs || 10,
        gates_mode: settings.gates_mode === 'enforce' ? 'enforce' : 'shadow',
        max_fix_iterations: settings.max_fix_iterations || 0,
        lock_wait_timeout_sec: settings.lock_wait_timeout_sec || 0,
        gate_timeout_sec: settings.gate_timeout_sec || 0,
      });
      this.lastProvider = provider;
      this.syncRunnerRequirement();
    } finally {
      this.suppressProviderReload = false;
    }
  }

  private loadProviderDrafts(settings: AISettings): void {
    for (const key of Object.keys(this.providerDrafts)) {
      delete this.providerDrafts[key];
    }
    for (const [id, slot] of Object.entries(settings.providers || {})) {
      this.providerDrafts[id] = this.draftFromSlot(slot);
    }
    const current = settings.agent_provider || 'opencode';
    this.providerDrafts[current] = {
      agent_base_url:
        settings.agent_base_url ||
        settings.opencode_base_url ||
        this.providerDrafts[current]?.agent_base_url ||
        '',
      agent_web_base_url:
        settings.agent_web_base_url ||
        settings.opencode_web_base_url ||
        this.providerDrafts[current]?.agent_web_base_url ||
        '',
      run_via_runner:
        settings.run_via_runner ??
        this.providerDrafts[current]?.run_via_runner ??
        false,
      default_model:
        settings.default_model ||
        this.providerDrafts[current]?.default_model ||
        '',
      default_effort:
        settings.default_effort ||
        this.providerDrafts[current]?.default_effort ||
        '',
    };
  }

  private stashProviderDraft(id: string): void {
    const provider = (id || '').trim();
    if (!provider) {
      return;
    }
    this.providerDrafts[provider] = {
      agent_base_url: this.form.controls.agent_base_url.value || '',
      agent_web_base_url: this.form.controls.agent_web_base_url.value || '',
      run_via_runner: this.runnerRequired
        ? true
        : !!this.form.controls.run_via_runner.value,
      default_model: this.form.controls.default_model.value || '',
      default_effort: this.form.controls.default_effort.value || '',
    };
  }

  private applyProviderDraft(id: string): void {
    const draft = this.providerDrafts[id] || this.emptyDraft();
    this.form.patchValue({
      run_via_runner: draft.run_via_runner,
      agent_base_url: draft.agent_base_url,
      agent_web_base_url: draft.agent_web_base_url,
      default_model: draft.default_model,
      default_effort: draft.default_effort,
    });
  }

  private providersPayload(selected: string): Record<string, AIProviderSettings> {
    this.stashProviderDraft(selected);
    const out: Record<string, AIProviderSettings> = {};
    for (const [id, draft] of Object.entries(this.providerDrafts)) {
      out[id] = {
        base_url: draft.agent_base_url,
        web_base_url: draft.agent_web_base_url,
        run_via_runner: draft.run_via_runner,
        default_model: draft.default_model,
        default_effort: draft.default_effort,
      };
    }
    return out;
  }

  private draftFromSlot(slot: AIProviderSettings): ProviderDraft {
    return {
      agent_base_url: slot.base_url || '',
      agent_web_base_url: slot.web_base_url || '',
      run_via_runner: !!slot.run_via_runner,
      default_model: slot.default_model || '',
      default_effort: slot.default_effort || '',
    };
  }

  private emptyDraft(): ProviderDraft {
    return {
      agent_base_url: '',
      agent_web_base_url: '',
      run_via_runner: false,
      default_model: '',
      default_effort: '',
    };
  }

  /** Re-apply select values so labels resolve after staticData updates. */
  private rebindSelects(): void {
    this.suppressProviderReload = true;
    try {
      this.form.patchValue({
        agent_provider: this.form.controls.agent_provider.value,
        actor_user_id: this.form.controls.actor_user_id.value,
        default_model: this.form.controls.default_model.value,
        default_effort: this.form.controls.default_effort.value,
        gates_mode: this.form.controls.gates_mode.value,
      });
    } finally {
      this.suppressProviderReload = false;
    }
  }

  private option(id: string, label: string): ISelectItem<string> {
    return { id, label };
  }

  private effortOptions(includeInherit: boolean): ISelectItem<string>[] {
    const levels: ISelectItem<string>[] = [
      this.option('low', this.transloco.translate('settings.ai-effort-low')),
      this.option('medium', this.transloco.translate('settings.ai-effort-medium')),
      this.option('high', this.transloco.translate('settings.ai-effort-high')),
      this.option('xhigh', this.transloco.translate('settings.ai-effort-xhigh')),
      this.option('max', this.transloco.translate('settings.ai-effort-max')),
      this.option('ultra', this.transloco.translate('settings.ai-effort-ultra')),
    ];
    if (!includeInherit) {
      return [
        this.option('', this.transloco.translate('settings.ai-effort-model-default')),
        ...levels,
      ];
    }
    return [
      this.option('', this.transloco.translate('settings.ai-effort-inherit')),
      ...levels,
    ];
  }
}

type ProviderDraft = {
  agent_base_url: string;
  agent_web_base_url: string;
  run_via_runner: boolean;
  default_model: string;
  default_effort: string;
};
