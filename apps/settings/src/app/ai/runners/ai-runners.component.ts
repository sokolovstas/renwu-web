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
  RwAlertService,
  RwButtonComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import { AIRunner, RwDataService } from '@renwu/core';
import { copyToClipboard } from '@renwu/utils';
import { defaultIfEmpty, firstValueFrom } from 'rxjs';

/** Mirrors model.RunnerStaleAfter in services/ai/model/runner.go. */
const STALE_AFTER_MS = 2 * 60 * 1000;

@Component({
  selector: 'renwu-settings-ai-runners',
  standalone: true,
  imports: [ReactiveFormsModule, RwButtonComponent, RwTextInputComponent, TranslocoPipe],
  templateUrl: './ai-runners.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiRunnersComponent {
  private readonly data = inject(RwDataService);
  private readonly alert = inject(RwAlertService);
  private readonly toast = inject(RwToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cd = inject(ChangeDetectorRef);

  readonly items = signal<AIRunner[]>([]);
  /** Set only right after a successful register — cleared on dismiss/navigate away. Never persisted or re-fetchable. */
  readonly freshToken = signal<string | null>(null);
  readonly registering = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const items = await firstValueFrom(
        this.data.aiListRunners().pipe(defaultIfEmpty([])),
      );
      this.items.set(items ?? []);
    } finally {
      this.cd.markForCheck();
    }
  }

  async register(): Promise<void> {
    const name = this.form.controls.name.value.trim();
    if (!name || this.registering()) return;
    this.registering.set(true);
    try {
      const result = await firstValueFrom(
        this.data.aiCreateRunner(name).pipe(defaultIfEmpty(null)),
      );
      if (!result) return;
      this.freshToken.set(result.token);
      this.form.reset({ name: '' });
      await this.load();
    } finally {
      this.registering.set(false);
      this.cd.markForCheck();
    }
  }

  async copyToken(): Promise<void> {
    const token = this.freshToken();
    if (!token) return;
    await copyToClipboard(token);
    this.toast.success(this.transloco.translate('settings.ai-runner-token-copied'));
  }

  dismissToken(): void {
    this.freshToken.set(null);
  }

  async revoke(item: AIRunner): Promise<void> {
    const result = await firstValueFrom(
      this.alert.confirm(
        this.transloco.translate('settings.ai-runner-revoke-title'),
        this.transloco.translate('settings.ai-runner-revoke-text'),
        true,
        this.transloco.translate('settings.ai-runner-revoke'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!result?.affirmative) return;
    await firstValueFrom(
      this.data.aiRevokeRunner(item.id).pipe(defaultIfEmpty(null)),
    );
    this.toast.success(this.transloco.translate('settings.ai-runner-revoked'));
    await this.load();
  }

  status(item: AIRunner): 'revoked' | 'online' | 'offline' {
    if (item.revoked_at) return 'revoked';
    if (!item.last_seen_at) return 'offline';
    const age = Date.now() - new Date(item.last_seen_at).getTime();
    return age <= STALE_AFTER_MS ? 'online' : 'offline';
  }

  statusLabelKey(item: AIRunner): string {
    return `settings.ai-runner-status-${this.status(item)}`;
  }
}
