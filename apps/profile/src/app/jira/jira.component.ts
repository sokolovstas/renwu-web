import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RwPageComponent } from '@renwu/app-ui';
import {
  RwButtonComponent,
  RwTextInputComponent,
  RwToastService,
} from '@renwu/components';
import {
  JiraAuthMode,
  JiraUserCredentials,
  RwDataService,
} from '@renwu/core';
import { defaultIfEmpty, firstValueFrom, Observable } from 'rxjs';

@Component({
  selector: 'renwu-profile-jira',
  standalone: true,
  imports: [
    RwPageComponent,
    ReactiveFormsModule,
    RwTextInputComponent,
    RwButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './jira.component.html',
  styleUrl: './jira.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JiraComponent {
  private dataService = inject(RwDataService);
  private toastService = inject(RwToastService);
  private transloco = inject(TranslocoService);
  private cd = inject(ChangeDetectorRef);

  readonly authModes: { value: JiraAuthMode; labelKey: string }[] = [
    { value: 'pat', labelKey: 'profile.jira-auth-pat' },
    { value: 'basic', labelKey: 'profile.jira-auth-basic' },
  ];

  busy = signal(false);
  configured = signal(false);

  form = new FormGroup({
    auth_mode: new FormControl<JiraAuthMode>('pat', { nonNullable: true }),
    rest_api_user: new FormControl('', { nonNullable: true }),
    rest_api_password: new FormControl('', { nonNullable: true }),
    jira_email: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.load();
  }

  private async callApi<T>(source: Observable<T>): Promise<T | null> {
    return firstValueFrom(source.pipe(defaultIfEmpty(null)));
  }

  private apply(cred: JiraUserCredentials): void {
    const mode = (cred.auth_mode || '').toLowerCase();
    this.form.patchValue({
      auth_mode: mode === 'basic' ? 'basic' : 'pat',
      rest_api_user: cred.rest_api_user || '',
      rest_api_password: '',
      jira_email: cred.jira_email || '',
    });
    this.configured.set(!!cred.configured);
    this.form.markAsPristine();
    this.cd.markForCheck();
  }

  private async load(): Promise<void> {
    const cred = await this.callApi(this.dataService.jiraLoadMyCredentials());
    if (cred) {
      this.apply(cred);
    }
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const raw = this.form.getRawValue();
      const saved = await this.callApi(
        this.dataService.jiraSaveMyCredentials({
          auth_mode: raw.auth_mode,
          rest_api_user: raw.rest_api_user,
          rest_api_password: raw.rest_api_password,
          jira_email: raw.jira_email,
        }),
      );
      if (!saved) {
        return;
      }
      this.apply(saved);
      this.toastService.success(
        this.transloco.translate('profile.jira-token-saved'),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async test(): Promise<void> {
    this.busy.set(true);
    try {
      if (this.form.controls.rest_api_password.value?.trim()) {
        const saved = await this.callApi(
          this.dataService.jiraSaveMyCredentials({
            auth_mode: this.form.controls.auth_mode.value,
            rest_api_user: this.form.controls.rest_api_user.value,
            rest_api_password: this.form.controls.rest_api_password.value,
            jira_email: this.form.controls.jira_email.value,
          }),
        );
        if (!saved) {
          return;
        }
        this.apply(saved);
      }
      const ok = await this.callApi(this.dataService.jiraTestConnection());
      if (ok == null) {
        return;
      }
      this.toastService.success(this.transloco.translate('profile.jira-test-ok'));
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }
}
