import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwAlertService,
  RwButtonComponent,
  RwToastService,
} from '@renwu/components';
import { AIJob, RwDataService } from '@renwu/core';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

@Component({
  selector: 'renwu-settings-ai-jobs',
  standalone: true,
  imports: [RwButtonComponent, TranslocoPipe],
  templateUrl: './ai-jobs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiJobsComponent {
  private readonly data = inject(RwDataService);
  private readonly alert = inject(RwAlertService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly items = signal<AIJob[]>([]);
  readonly opencodeWebBase = signal('');

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [jobs, settings] = await Promise.all([
        firstValueFrom(this.data.aiListJobs().pipe(defaultIfEmpty([]))),
        firstValueFrom(this.data.aiLoadSettings().pipe(defaultIfEmpty(null))),
      ]);
      this.items.set(jobs ?? []);
      this.opencodeWebBase.set(
        (
          settings?.agent_web_base_url ||
          settings?.opencode_web_base_url ||
          ''
        ).replace(/\/$/, ''),
      );
    } finally {
      this.cd.markForCheck();
    }
  }

  sessionUrl(job: AIJob): string | null {
    if (!job.opencode_session) return null;
    const base = this.opencodeWebBase();
    if (!base) return null;
    // OpenCode UI deep-link: /server/<base64(origin)>/session/<id>
    const encoded = btoa(base).replace(/=+$/, '');
    return `${base}/server/${encoded}/session/${job.opencode_session}`;
  }

  canCancel(job: AIJob): boolean {
    return job.state === 'queued' || job.state === 'running';
  }

  canRetry(job: AIJob): boolean {
    return (
      job.state === 'failed' ||
      job.state === 'cancelled' ||
      job.state === 'succeeded'
    );
  }

  canApplySession(job: AIJob): boolean {
    return (
      !!job.opencode_session &&
      (job.state === 'failed' ||
        job.state === 'cancelled' ||
        job.state === 'succeeded')
    );
  }

  canCleanupWorktree(job: AIJob): boolean {
    return (
      !!job.worktree_path &&
      job.worktree_state !== 'removed' &&
      job.state !== 'queued' &&
      job.state !== 'running'
    );
  }

  async retry(job: AIJob): Promise<void> {
    if (!job.id) return;
    const saved = await firstValueFrom(
      this.data.aiRetryJob(job.id).pipe(defaultIfEmpty(null)),
    );
    if (!saved) return;
    this.toast.success(this.transloco.translate('settings.ai-retry-started'));
    await this.load();
  }

  async applySession(job: AIJob): Promise<void> {
    if (!job.id || !this.canApplySession(job)) return;
    const saved = await firstValueFrom(
      this.data.aiApplySessionJob(job.id).pipe(defaultIfEmpty(null)),
    );
    if (!saved) return;
    this.toast.success(
      this.transloco.translate('settings.ai-apply-session-done'),
    );
    await this.load();
  }

  async cancel(job: AIJob): Promise<void> {
    if (!job.id || !this.canCancel(job)) return;
    const saved = await firstValueFrom(
      this.data.aiCancelJob(job.id).pipe(defaultIfEmpty(null)),
    );
    if (!saved) return;
    this.toast.success(this.transloco.translate('settings.ai-cancelled'));
    await this.load();
  }

  async cleanupWorktree(job: AIJob): Promise<void> {
    if (!job.id || !this.canCleanupWorktree(job)) return;
    const result = await firstValueFrom(
      this.alert.confirm(
        this.transloco.translate('settings.ai-cleanup-worktree-title'),
        this.transloco.translate('settings.ai-cleanup-worktree-text'),
        true,
        this.transloco.translate('settings.ai-cleanup-worktree'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!result?.affirmative) return;
    const saved = await firstValueFrom(
      this.data.aiCleanupJobWorktree(job.id).pipe(defaultIfEmpty(null)),
    );
    if (!saved) return;
    this.toast.success(
      this.transloco.translate('settings.ai-cleanup-worktree-done'),
    );
    await this.load();
  }
}
