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
  readonly form = new FormGroup({
    id: new FormControl<string | undefined>(undefined),
    name: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true }),
    body: new FormControl('', { nonNullable: true }),
    model: new FormControl('', { nonNullable: true }),
    timeout_sec: new FormControl(300, { nonNullable: true }),
    enabled: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    this.modelModel.allowNull = true;
    this.modelModel.loadSelected = true;
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [skills, modelsResponse] = await Promise.all([
        firstValueFrom(this.data.aiListSkills().pipe(defaultIfEmpty([]))),
        firstValueFrom(
          this.data.aiListOpenCodeModels().pipe(defaultIfEmpty({ models: [] })),
        ),
      ]);
      this.items.set(skills || []);
      this.modelModel.staticData = (modelsResponse?.models || []).map((m) =>
        this.option(m.id, m.label || m.id),
      );
    } finally {
      this.cd.markForCheck();
    }
  }

  edit(item?: AISkill): void {
    this.form.reset({
      timeout_sec: 300,
      enabled: true,
      ...(item || {}),
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
    const saved = await firstValueFrom(
      this.data.aiSaveSkill(this.form.getRawValue()).pipe(defaultIfEmpty(null)),
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
