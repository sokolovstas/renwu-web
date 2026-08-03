import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RenwuPageComponent } from '@renwu/app-ui';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RwAlertService, RwButtonComponent, RwToastService } from '@renwu/components';
import { AIConfigBundle, RwDataService } from '@renwu/core';
import { firstValueFrom } from 'rxjs';
import { AiSettingsComponent } from './settings/ai-settings.component';
import { AiWorkspacesComponent } from './workspaces/ai-workspaces.component';
import { AiSkillsComponent } from './skills/ai-skills.component';
import { AiWorkflowsComponent } from './workflows/ai-workflows.component';
import { AiJobsComponent } from './jobs/ai-jobs.component';

type AiTab = 'settings' | 'workspaces' | 'skills' | 'workflows' | 'jobs';

@Component({
  selector: 'renwu-settings-ai',
  standalone: true,
  imports: [
    RenwuPageComponent,
    RwButtonComponent,
    TranslocoPipe,
    AiSettingsComponent,
    AiWorkspacesComponent,
    AiSkillsComponent,
    AiWorkflowsComponent,
    AiJobsComponent,
  ],
  templateUrl: './ai.component.html',
  styleUrl: './ai.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiComponent {
  private readonly data = inject(RwDataService);
  private readonly toast = inject(RwToastService);
  private readonly alert = inject(RwAlertService);
  private readonly transloco = inject(TranslocoService);

  readonly importInput = viewChild<ElementRef<HTMLInputElement>>('importInput');

  readonly tabs: { id: AiTab; labelKey: string }[] = [
    { id: 'settings', labelKey: 'settings.ai-settings' },
    { id: 'workspaces', labelKey: 'settings.ai-workspaces' },
    { id: 'skills', labelKey: 'settings.ai-skills' },
    { id: 'workflows', labelKey: 'settings.ai-workflows' },
    { id: 'jobs', labelKey: 'settings.ai-jobs' },
  ];
  readonly activeTab = signal<AiTab>('settings');
  readonly busy = signal(false);
  /** Bumps after import so tab panels re-fetch from API. */
  readonly configEpoch = signal(0);

  selectTab(tab: AiTab): void {
    this.activeTab.set(tab);
  }

  async exportConfig(): Promise<void> {
    this.busy.set(true);
    try {
      const bundle = await firstValueFrom(this.data.aiExportConfig());
      downloadJson('renwu-ai-config.json', bundle);
      this.toast.success(this.transloco.translate('settings.ai-export-done'));
    } finally {
      this.busy.set(false);
    }
  }

  pickImportFile(): void {
    this.importInput()?.nativeElement.click();
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const confirmed = await firstValueFrom(
      this.alert.confirm(
        this.transloco.translate('settings.ai-import-title'),
        this.transloco.translate('settings.ai-import-text'),
        true,
        this.transloco.translate('settings.ai-import'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!confirmed?.affirmative) {
      return;
    }
    this.busy.set(true);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as AIConfigBundle;
      await firstValueFrom(this.data.aiImportConfig(bundle));
      this.configEpoch.update((n) => n + 1);
      this.toast.success(this.transloco.translate('settings.ai-import-done'));
    } catch {
      this.toast.error(this.transloco.translate('settings.ai-import-failed'));
    } finally {
      this.busy.set(false);
    }
  }
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
