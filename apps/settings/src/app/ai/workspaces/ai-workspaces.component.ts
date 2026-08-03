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
import { AIProviderInfo, AIWorkspace, RwDataService } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-settings-ai-workspaces',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RwButtonComponent,
    RwSelectComponent,
    RwTextInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './ai-workspaces.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWorkspacesComponent {
  private readonly data = inject(RwDataService);
  private readonly alert = inject(RwAlertService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly items = signal<AIWorkspace[]>([]);
  readonly form = new FormGroup({
    id: new FormControl<string | undefined>(undefined),
    name: new FormControl('', { nonNullable: true }),
    container_id: new FormControl('', { nonNullable: true }),
    workdir: new FormControl('', { nonNullable: true }),
    default_branch: new FormControl('', { nonNullable: true }),
    verify_commands: new FormControl('', { nonNullable: true }),
    enabled: new FormControl(true, { nonNullable: true }),
    agent_provider: new FormControl('', { nonNullable: true }),
    agent_base_url: new FormControl('', { nonNullable: true }),
    agent_web_base_url: new FormControl('', { nonNullable: true }),
  });
  readonly containerModel = new SelectModelBase<string>();
  readonly providerModel = new SelectModelBase<string>();
  providers: AIProviderInfo[] = [];

  constructor() {
    this.containerModel.allowNull = true;
    this.containerModel.loadSelected = true;
    this.providerModel.allowNull = true;
    this.providerModel.loadSelected = true;
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [items, containers, providersResp] = await Promise.all([
        firstValueFrom(this.data.aiListWorkspaces().pipe(defaultIfEmpty([]))),
        firstValueFrom(this.data.getContainers({}).pipe(defaultIfEmpty([]))),
        firstValueFrom(
          this.data.aiListProviders().pipe(defaultIfEmpty({ providers: [] })),
        ),
      ]);
      this.items.set(items ?? []);
      this.providers = providersResp?.providers || [];
      this.providerModel.staticData = [
        this.option(
          '',
          this.transloco.translate('settings.ai-provider-inherit'),
        ),
        ...this.providers.map((p) => this.option(p.id, p.label || p.id)),
      ];
      this.containerModel.staticData = (containers ?? []).map(
        (container) =>
          ({
            id: String(container.id),
            label: container.key
              ? `${container.key} — ${container.title || ''}`
              : String(container.id),
          }) as ISelectItem<string>,
      );
    } finally {
      this.cd.markForCheck();
    }
  }

  edit(item?: AIWorkspace): void {
    this.form.reset({
      id: item?.id,
      name: item?.name || '',
      container_id: item?.container_id || '',
      workdir: item?.workdir || '',
      default_branch: item?.default_branch || '',
      verify_commands: item?.verify_commands || '',
      enabled: item?.enabled ?? true,
      agent_provider: item?.agent_provider || '',
      agent_base_url: item?.agent_base_url || '',
      agent_web_base_url: item?.agent_web_base_url || '',
    });
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const raw = this.form.getRawValue();
    if (!raw.name?.trim() || !raw.container_id || !raw.workdir?.trim()) {
      this.toast.error(
        this.transloco.translate('settings.ai-workspace-required'),
      );
      return;
    }
    const payload: AIWorkspace = {
      ...raw,
      agent_provider: raw.agent_provider?.trim() || undefined,
      agent_base_url: raw.agent_base_url?.trim() || undefined,
      agent_web_base_url: raw.agent_web_base_url?.trim() || undefined,
    };
    const saved = await firstValueFrom(
      this.data.aiSaveWorkspace(payload).pipe(defaultIfEmpty(null)),
    );
    if (!saved) {
      return;
    }
    this.toast.success(this.transloco.translate('settings.ai-saved'));
    this.edit(saved);
    await this.load();
  }

  async remove(item: AIWorkspace): Promise<void> {
    if (!item.id || !(await this.confirm())) return;
    await firstValueFrom(
      this.data.aiDeleteWorkspace(item.id).pipe(defaultIfEmpty(null)),
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
