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

  readonly gatesModeModel = new SelectModelBase<string>();
  readonly form = new FormGroup({
    enabled: new FormControl(false, { nonNullable: true }),
    run_via_runner: new FormControl(false, { nonNullable: true }),
    agent_provider: new FormControl('opencode', { nonNullable: true }),
    agent_base_url: new FormControl('', { nonNullable: true }),
    agent_web_base_url: new FormControl('', { nonNullable: true }),
    actor_user_id: new FormControl('', { nonNullable: true }),
    default_model: new FormControl('', { nonNullable: true }),
    max_concurrent_jobs: new FormControl(1, { nonNullable: true }),
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
    this.form.controls.agent_provider.valueChanges.subscribe(() => {
      if (this.suppressProviderReload) {
        return;
      }
      void this.onProviderChanged();
    });
    void this.load();
  }

  private async onProviderChanged(): Promise<void> {
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
    const baseUrl =
      opts?.baseUrl?.trim() ||
      this.form.controls.agent_base_url.value?.trim() ||
      undefined;
    const provider =
      opts?.provider?.trim() ||
      this.form.controls.agent_provider.value?.trim() ||
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
      if (opts?.dropUnknown || provider === 'claude_code') {
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
      const raw = this.form.getRawValue();
      const payload: AISettings = {
        ...raw,
        opencode_base_url: raw.agent_base_url,
        opencode_web_base_url: raw.agent_web_base_url,
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
    const baseUrl =
      settings.agent_base_url || settings.opencode_base_url || '';
    const webUrl =
      settings.agent_web_base_url || settings.opencode_web_base_url || '';
    this.suppressProviderReload = true;
    try {
      this.form.patchValue({
        enabled: !!settings.enabled,
        run_via_runner: !!settings.run_via_runner,
        agent_provider: settings.agent_provider || 'opencode',
        agent_base_url: baseUrl,
        agent_web_base_url: webUrl,
        actor_user_id: settings.actor_user_id || '',
        default_model: settings.default_model || '',
        max_concurrent_jobs: settings.max_concurrent_jobs || 1,
        gates_mode: settings.gates_mode === 'enforce' ? 'enforce' : 'shadow',
        max_fix_iterations: settings.max_fix_iterations || 0,
        lock_wait_timeout_sec: settings.lock_wait_timeout_sec || 0,
        gate_timeout_sec: settings.gate_timeout_sec || 0,
      });
    } finally {
      this.suppressProviderReload = false;
    }
  }

  /** Re-apply select values so labels resolve after staticData updates. */
  private rebindSelects(): void {
    this.form.patchValue({
      agent_provider: this.form.controls.agent_provider.value,
      actor_user_id: this.form.controls.actor_user_id.value,
      default_model: this.form.controls.default_model.value,
      gates_mode: this.form.controls.gates_mode.value,
    });
  }

  private option(id: string, label: string): ISelectItem<string> {
    return { id, label };
  }
}
