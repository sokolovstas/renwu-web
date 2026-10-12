import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { AISkill, RwDataService } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-settings-ai-skills',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RwButtonComponent,
    RwSelectComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './ai-skills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSkillsComponent {
  private readonly data = inject(RwDataService);
  private readonly alert = inject(RwAlertService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly items = signal<AISkill[]>([]);
  readonly modelModel = new SelectModelBase<string>();
  readonly effortModel = new SelectModelBase<string>();
  readonly reviewSkillModel = new SelectModelBase<string>();
  readonly form = new FormGroup({
    id: new FormControl<string | undefined>(undefined),
    name: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true }),
    body: new FormControl('', { nonNullable: true }),
    model: new FormControl('', { nonNullable: true }),
    effort: new FormControl('', { nonNullable: true }),
    timeout_sec: new FormControl(300, { nonNullable: true }),
    enabled: new FormControl(true, { nonNullable: true }),
    permission_mode: new FormControl('', { nonNullable: true }),
    allowed_tools: new FormControl('', { nonNullable: true }),
    max_turns: new FormControl(0, { nonNullable: true }),
    max_budget_usd: new FormControl(0, { nonNullable: true }),
    gate_names: new FormControl('', { nonNullable: true }),
    review_skill_id: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.modelModel.allowNull = true;
    this.modelModel.loadSelected = true;
    this.effortModel.allowNull = true;
    this.effortModel.loadSelected = true;
    this.effortModel.staticData = [
      this.option('', this.transloco.translate('settings.ai-effort-inherit')),
      this.option('low', this.transloco.translate('settings.ai-effort-low')),
      this.option('medium', this.transloco.translate('settings.ai-effort-medium')),
      this.option('high', this.transloco.translate('settings.ai-effort-high')),
      this.option('xhigh', this.transloco.translate('settings.ai-effort-xhigh')),
      this.option('max', this.transloco.translate('settings.ai-effort-max')),
      this.option('ultra', this.transloco.translate('settings.ai-effort-ultra')),
    ];
    this.reviewSkillModel.allowNull = true;
    this.reviewSkillModel.loadSelected = true;
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [skills, modelsResponse] = await Promise.all([
        firstValueFrom(this.data.aiListSkills().pipe(defaultIfEmpty([]))),
        firstValueFrom(
          this.data.aiListAgentModels().pipe(defaultIfEmpty({ models: [] })),
        ),
      ]);
      this.items.set(skills || []);
      this.reviewSkillModel.staticData = (skills || []).map((s) =>
        this.option(s.id || '', s.name || s.slug || s.id || ''),
      );
      this.modelModel.staticData = (modelsResponse?.models || []).map((m) =>
        this.option(m.id, m.label || m.id),
      );
    } finally {
      this.cd.markForCheck();
    }
  }

  edit(item?: AISkill): void {
    this.form.reset({
      id: item?.id,
      name: item?.name || '',
      slug: item?.slug || '',
      body: item?.body || '',
      model: item?.model || '',
      effort: item?.effort || '',
      timeout_sec: item?.timeout_sec ?? 300,
      enabled: item?.enabled ?? true,
      permission_mode: item?.permission_mode || '',
      allowed_tools: (item?.allowed_tools || []).join(', '),
      max_turns: item?.max_turns || 0,
      max_budget_usd: item?.max_budget_usd || 0,
      gate_names: (item?.gate_names || []).join(', '),
      review_skill_id: item?.review_skill_id || '',
    });
    const current = this.form.controls.model.value;
    if (current && !this.modelModel.staticData?.some((x) => x.id === current)) {
      this.modelModel.staticData = [
        this.option(current, current),
        ...(this.modelModel.staticData || []),
      ];
    }
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const raw = this.form.getRawValue();
    const allowed_tools = (raw.allowed_tools || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const gate_names = (raw.gate_names || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const saved = await firstValueFrom(
      this.data
        .aiSaveSkill({
          id: raw.id,
          name: raw.name,
          slug: raw.slug,
          body: raw.body,
          model: raw.model,
          effort: raw.effort || undefined,
          timeout_sec: raw.timeout_sec,
          enabled: raw.enabled,
          allowed_tools,
          max_turns: raw.max_turns || undefined,
          max_budget_usd: raw.max_budget_usd || undefined,
          permission_mode: raw.permission_mode || undefined,
          gate_names: gate_names.length ? gate_names : undefined,
          review_skill_id: raw.review_skill_id?.trim() || undefined,
        })
        .pipe(defaultIfEmpty(null)),
    );
    if (!saved) {
      return;
    }
    this.toast.success(this.transloco.translate('settings.ai-saved'));
    this.edit(saved);
    await this.load();
  }

  async remove(item: AISkill): Promise<void> {
    if (!item.id || !(await this.confirm())) return;
    await firstValueFrom(
      this.data.aiDeleteSkill(item.id).pipe(defaultIfEmpty(null)),
    );
    this.toast.success(this.transloco.translate('settings.ai-deleted'));
    if (this.form.controls.id.value === item.id) this.edit();
    await this.load();
  }

  private option(id: string, label: string): ISelectItem<string> {
    return { id, label };
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
