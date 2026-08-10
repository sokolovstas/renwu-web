import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RenwuPageComponent } from '@renwu/app-ui';
import {
  ISelectItem,
  RwAlertService,
  RwButtonComponent,
  RwCheckboxComponent,
  RwSelectComponent,
  RwTextInputComponent,
  RwToastService,
  SelectModelBase,
} from '@renwu/components';
import {
  IssueHrefComponent,
  JiraConfigBundle,
  JiraDictCatalog,
  JiraDictMatch,
  JiraFieldCondition,
  JiraIssueDiff,
  JiraProjMatch,
  JiraPushMode,
  JiraSettings,
  JiraSyncField,
  JiraSyncTemplate,
  RwDataService,
} from '@renwu/core';
import {
  catchError,
  defaultIfEmpty,
  firstValueFrom,
  Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';

type DictMappingKey =
  | 'status_mapping'
  | 'priority_mapping'
  | 'type_mapping';

type MappingKey = DictMappingKey | 'project_mapping';

type JiraSettingsTab =
  | 'connection'
  | 'push'
  | 'mappings'
  | 'templates'
  | 'drift';

@Component({
  selector: 'renwu-settings-jira',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    RenwuPageComponent,
    RwButtonComponent,
    RwCheckboxComponent,
    RwSelectComponent,
    RwTextInputComponent,
    IssueHrefComponent,
    TranslocoPipe,
  ],
  templateUrl: './jira.component.html',
  styleUrl: './jira.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JiraComponent {
  private dataService = inject(RwDataService);
  private toastService = inject(RwToastService);
  private alertService = inject(RwAlertService);
  private transloco = inject(TranslocoService);
  private cd = inject(ChangeDetectorRef);

  /** Filter text for Renwu side of each mapping table. */
  mappingFilter = signal<Record<MappingKey, string>>({
    status_mapping: '',
    priority_mapping: '',
    type_mapping: '',
    project_mapping: '',
  });

  private jiraCatalog: JiraDictCatalog = {};

  /** Shared option lists per mapping kind (copied into per-row select models). */
  private jiraOptionLists: Record<MappingKey, ISelectItem<string>[]> = {
    status_mapping: [],
    priority_mapping: [],
    type_mapping: [],
    project_mapping: [],
  };

  /** One SelectModel per mapping row — shared model would sync selected across rows. */
  private jiraRowModels = new Map<string, SelectModelBase<string>>();

  /** Per-row models for template field direction / when op selects. */
  private templateSelectModels = new Map<string, SelectModelBase<string>>();

  /** Renwu dictionary / container options for new mapping rows. */
  private ourOptionLists: Record<MappingKey, ISelectItem<string>[]> = {
    status_mapping: [],
    priority_mapping: [],
    type_mapping: [],
    project_mapping: [],
  };
  private ourRowModels = new Map<string, SelectModelBase<string>>();

  readonly tabs: { id: JiraSettingsTab; labelKey: string }[] = [
    { id: 'connection', labelKey: 'settings.jira-connection' },
    { id: 'push', labelKey: 'settings.jira-push-mode' },
    { id: 'mappings', labelKey: 'settings.jira-mappings' },
    { id: 'templates', labelKey: 'settings.jira-templates' },
    { id: 'drift', labelKey: 'settings.jira-bulk-drift' },
  ];

  activeTab = signal<JiraSettingsTab>('connection');

  readonly pushModes: { value: JiraPushMode; labelKey: string }[] = [
    { value: 'manual', labelKey: 'settings.jira-push-manual' },
    { value: 'auto_mapped', labelKey: 'settings.jira-push-auto-mapped' },
    { value: 'auto_all', labelKey: 'settings.jira-push-auto-all' },
  ];

  selectTab(tab: JiraSettingsTab): void {
    this.activeTab.set(tab);
  }

  readonly dictMappings: { key: DictMappingKey; titleKey: string }[] = [
    {
      key: 'status_mapping',
      titleKey: 'settings.jira-mapping-status_mapping',
    },
    {
      key: 'priority_mapping',
      titleKey: 'settings.jira-mapping-priority_mapping',
    },
    { key: 'type_mapping', titleKey: 'settings.jira-mapping-type_mapping' },
  ];

  readonly directions = [
    { value: '<>', labelKey: 'settings.jira-direction-both' },
    { value: '>', labelKey: 'settings.jira-direction-import' },
    { value: '<', labelKey: 'settings.jira-direction-export' },
  ];

  readonly conditionOps = [
    { value: 'eq', labelKey: 'settings.jira-op-eq' },
    { value: 'in', labelKey: 'settings.jira-op-in' },
  ];

  readonly importAutoIntervals = [
    { value: 5, labelKey: 'settings.jira-import-auto-interval-5m' },
    { value: 15, labelKey: 'settings.jira-import-auto-interval-15m' },
    { value: 30, labelKey: 'settings.jira-import-auto-interval-30m' },
    { value: 60, labelKey: 'settings.jira-import-auto-interval-1h' },
    { value: 180, labelKey: 'settings.jira-import-auto-interval-3h' },
    { value: 360, labelKey: 'settings.jira-import-auto-interval-6h' },
    { value: 720, labelKey: 'settings.jira-import-auto-interval-12h' },
    { value: 1440, labelKey: 'settings.jira-import-auto-interval-1d' },
  ];

  selectedTemplateIndex = signal(0);
  diffs = signal<JiraIssueDiff[]>([]);
  selectedDiffIds = signal<Set<string>>(new Set());
  busy = signal(false);
  readonly importInput = viewChild<ElementRef<HTMLInputElement>>('importInput');

  form = new FormGroup({
    rest_api_url: new FormControl('', { nonNullable: true }),
    public_url: new FormControl('', { nonNullable: true }),
    hook_address: new FormControl('', { nonNullable: true }),
    jql: new FormControl('', { nonNullable: true }),
    oql: new FormControl('', { nonNullable: true }),
    push_mode: new FormControl<JiraPushMode>('manual', { nonNullable: true }),
    import_auto_enabled: new FormControl(false, { nonNullable: true }),
    import_auto_interval_minutes: new FormControl(60, { nonNullable: true }),
    epic_our_type_ids: new FormArray<FormControl<string>>([]),
    status_mapping: new FormArray<FormGroup>([]),
    priority_mapping: new FormArray<FormGroup>([]),
    type_mapping: new FormArray<FormGroup>([]),
    project_mapping: new FormArray<FormGroup>([]),
    templates: new FormArray<FormGroup>([]),
  });

  epicTypeAddId = '';
  epicTypeAddModel = this.createJiraSelectModel([]);

  settings$ = this.dataService.jiraLoadSettings().pipe(
    // catchHandler returns EMPTY on HTTP errors — still render an empty form.
    defaultIfEmpty({} as JiraSettings),
    catchError(() => of({} as JiraSettings)),
    tap((settings) => this.applySettings(settings || {})),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  get templates(): FormArray<FormGroup> {
    return this.form.controls.templates;
  }

  get epicOurTypeIds(): FormArray<FormControl<string>> {
    return this.form.controls.epic_our_type_ids;
  }

  mappingArray(key: DictMappingKey | 'project_mapping'): FormArray<FormGroup> {
    return this.form.controls[key];
  }

  selectedTemplate(): FormGroup | null {
    const idx = this.selectedTemplateIndex();
    return this.templates.at(idx) ?? null;
  }

  selectedTemplateWhen(): FormArray<FormGroup> | null {
    return this.selectedTemplate()?.get('when') as FormArray<FormGroup> | null;
  }

  selectedTemplateFields(): FormArray<FormGroup> | null {
    return this.selectedTemplate()?.get(
      'fields',
    ) as FormArray<FormGroup> | null;
  }

  applySettings(settings: JiraSettings): void {
    this.form.patchValue({
      rest_api_url: settings.rest_api_url || '',
      public_url: settings.public_url || '',
      hook_address: settings.hook_address || '',
      jql: settings.jql || '',
      oql: settings.oql || '',
      push_mode: (settings.push_mode as JiraPushMode) || 'manual',
      import_auto_enabled: !!settings.import_auto_enabled,
      import_auto_interval_minutes:
        settings.import_auto_interval_minutes || 60,
    });

    this.jiraCatalog = settings.jira_catalog || {};
    this.replaceEpicOurTypeIds(settings.epic_our_type_ids);
    this.replaceDictMapping('status_mapping', settings.status_mapping);
    this.replaceDictMapping('priority_mapping', settings.priority_mapping);
    this.replaceDictMapping('type_mapping', settings.type_mapping);
    this.replaceProjectMapping(settings.project_mapping);
    this.syncJiraSelectModels();
    this.replaceTemplates(settings);
    void this.loadOurCatalogs();

    this.selectedTemplateIndex.set(0);
    this.form.markAsPristine();
    this.cd.markForCheck();
  }

  private replaceDictMapping(
    key: DictMappingKey,
    rows: JiraDictMatch[] | undefined,
  ): void {
    this.clearRowModels(key);
    const arr = this.form.controls[key];
    arr.clear();
    const seen = new Set<string>();
    for (const row of rows || []) {
      const ourId = row?.our?.[0]?.id;
      if (!ourId || seen.has(ourId)) {
        continue;
      }
      seen.add(ourId);
      arr.push(this.createDictRow(row));
    }
  }

  private replaceProjectMapping(rows: JiraProjMatch[] | undefined): void {
    this.clearRowModels('project_mapping');
    const arr = this.form.controls.project_mapping;
    arr.clear();
    const seen = new Set<string>();
    for (const row of rows || []) {
      const ourId = row?.our?.[0]?.id;
      if (!ourId || seen.has(ourId)) {
        continue;
      }
      seen.add(ourId);
      arr.push(this.createProjectRow(row));
    }
  }

  private createJiraSelectModel(
    staticData: ISelectItem<string>[],
  ): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.allowNull = true;
    model.staticData = staticData;
    return model;
  }

  private clearRowModels(prefix?: MappingKey): void {
    if (!prefix) {
      this.jiraRowModels.clear();
      return;
    }
    for (const key of [...this.jiraRowModels.keys()]) {
      if (key.startsWith(`${prefix}:`)) {
        this.jiraRowModels.delete(key);
      }
    }
  }

  jiraModelFor(
    key: MappingKey,
    ourId: string,
    rowIndex = 0,
  ): SelectModelBase<string> {
    const cacheKey = ourId
      ? `${key}:${ourId}`
      : `${key}:draft:${rowIndex}`;
    let model = this.jiraRowModels.get(cacheKey);
    const options = this.jiraOptionLists[key] || [];
    if (!model) {
      model = this.createJiraSelectModel(options);
      this.jiraRowModels.set(cacheKey, model);
    } else {
      model.staticData = options;
    }
    return model;
  }

  ourModelFor(key: MappingKey, rowIndex: number): SelectModelBase<string> {
    const cacheKey = `${key}:our:${rowIndex}`;
    let model = this.ourRowModels.get(cacheKey);
    const options = this.availableOurOptions(key, rowIndex);
    if (!model) {
      model = this.createJiraSelectModel(options);
      model.allowNull = false;
      this.ourRowModels.set(cacheKey, model);
    } else {
      model.staticData = options;
    }
    return model;
  }

  private availableOurOptions(
    key: MappingKey,
    rowIndex: number,
  ): ISelectItem<string>[] {
    const used = new Set(
      this.mappingArray(key)
        .controls.map((row, index) =>
          index === rowIndex ? '' : String(row.get('our_id')?.value || ''),
        )
        .filter(Boolean),
    );
    return (this.ourOptionLists[key] || []).filter((o) => !used.has(String(o.id)));
  }

  private async loadOurCatalogs(): Promise<void> {
    try {
      const [statuses, types, priorities, containers] = await Promise.all([
        firstValueFrom(
          this.dataService.getIssueStatus({}).pipe(defaultIfEmpty([])),
        ),
        firstValueFrom(
          this.dataService.getIssueType({}).pipe(defaultIfEmpty([])),
        ),
        firstValueFrom(
          this.dataService.getIssuePriority({}).pipe(defaultIfEmpty([])),
        ),
        firstValueFrom(
          this.dataService.getContainers({}).pipe(defaultIfEmpty([])),
        ),
      ]);
      this.ourOptionLists.status_mapping = (statuses || []).map((s) => ({
        id: String(s.id),
        label: s.label || String(s.id),
      }));
      this.ourOptionLists.type_mapping = (types || []).map((t) => ({
        id: String(t.id),
        label: t.label || String(t.id),
      }));
      this.ourOptionLists.priority_mapping = (priorities || []).map((p) => ({
        id: String(p.id),
        label: p.label || String(p.id),
      }));
      this.ourOptionLists.project_mapping = (containers || []).map((c) => ({
        id: String(c.id),
        label: c.key
          ? `${c.key}${c.title ? ' — ' + c.title : ''}`
          : String(c.id),
      }));
      this.ourRowModels.clear();
      this.refreshEpicTypeAddModel();
      this.cd.markForCheck();
    } catch {
      // Keep existing mapping rows usable even if catalogs fail to load.
    }
  }

  directionModelFor(fieldIndex: number): SelectModelBase<string> {
    return this.templateEnumModel(
      `direction:${this.selectedTemplateIndex()}:${fieldIndex}`,
      this.directions.map((d) => ({
        id: d.value,
        label: this.transloco.translate(d.labelKey),
      })),
    );
  }

  conditionOpModelFor(condIndex: number): SelectModelBase<string> {
    return this.templateEnumModel(
      `when-op:${this.selectedTemplateIndex()}:${condIndex}`,
      this.conditionOps.map((op) => ({
        id: op.value,
        label: this.transloco.translate(op.labelKey),
      })),
    );
  }

  private templateEnumModel(
    cacheKey: string,
    options: ISelectItem<string>[],
  ): SelectModelBase<string> {
    let model = this.templateSelectModels.get(cacheKey);
    if (!model) {
      model = this.createJiraSelectModel(options);
      model.allowNull = false;
      this.templateSelectModels.set(cacheKey, model);
    } else {
      model.staticData = options;
    }
    return model;
  }

  private syncJiraSelectModels(): void {
    const unmapped = this.transloco.translate('settings.jira-unmapped');
    const toItems = (
      options: { id: string; label: string }[],
    ): ISelectItem<string>[] => [{ id: '', label: unmapped }, ...options];

    this.jiraOptionLists.status_mapping = toItems(this.catalogOptions('status'));
    this.jiraOptionLists.priority_mapping = toItems(
      this.catalogOptions('priority'),
    );
    this.jiraOptionLists.type_mapping = toItems(this.catalogOptions('type'));
    this.jiraOptionLists.project_mapping = toItems(
      this.catalogProjectOptions(),
    );
    this.clearRowModels();
  }

  private catalogOptions(
    kind: 'status' | 'priority' | 'type',
  ): { id: string; label: string }[] {
    const fromCatalog = (this.jiraCatalog[kind] || [])
      .filter((j) => !!j.id)
      .map((j) => ({
        id: String(j.id),
        label: j.name ? `${j.name} (${j.id})` : String(j.id),
      }));
    if (fromCatalog.length) {
      return this.sortOptions(fromCatalog);
    }
    // Fallback: options currently linked in mapping rows.
    const key = `${kind}_mapping` as DictMappingKey;
    const fromRows: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const row of this.mappingArray(key).controls) {
      const id = String(row.get('jira_id')?.value || '');
      const name = String(row.get('jira_name')?.value || '');
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      fromRows.push({ id, label: name ? `${name} (${id})` : id });
    }
    return this.sortOptions(fromRows);
  }

  private catalogProjectOptions(): { id: string; label: string }[] {
    const fromCatalog = (this.jiraCatalog.projects || [])
      .filter((j) => !!j.id)
      .map((j) => ({
        id: String(j.id),
        label: j.key ? `${j.key} (${j.id})` : String(j.id),
      }));
    if (fromCatalog.length) {
      return this.sortOptions(fromCatalog);
    }
    const fromRows: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const row of this.form.controls.project_mapping.controls) {
      const id = String(row.get('jira_id')?.value || '');
      const key = String(row.get('jira_key')?.value || '');
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      fromRows.push({ id, label: key ? `${key} (${id})` : id });
    }
    return this.sortOptions(fromRows);
  }

  private sortOptions(
    options: { id: string; label: string }[],
  ): { id: string; label: string }[] {
    return [...options].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
    );
  }

  setMappingFilter(key: MappingKey, value: string): void {
    this.mappingFilter.update((prev) => ({ ...prev, [key]: value }));
  }

  rowValue(row: FormGroup, controlName: string): string {
    return String(row.get(controlName)?.value ?? '');
  }

  filteredDictRows(
    key: DictMappingKey,
  ): { row: FormGroup; index: number }[] {
    const q = (this.mappingFilter()[key] || '').trim().toLowerCase();
    return this.mappingArray(key)
      .controls.map((row, index) => ({ row: row as FormGroup, index }))
      .filter(({ row }) => {
        const ourId = String(row.get('our_id')?.value || '');
        // Draft rows (plus button) stay visible until Renwu value is chosen.
        if (!ourId) {
          return !q;
        }
        if (!q) {
          return true;
        }
        const name = String(row.get('our_name')?.value || '').toLowerCase();
        return name.includes(q) || ourId.toLowerCase().includes(q);
      });
  }

  filteredProjectRows(): { row: FormGroup; index: number }[] {
    const q = (this.mappingFilter()['project_mapping'] || '')
      .trim()
      .toLowerCase();
    return this.form.controls.project_mapping.controls
      .map((row, index) => ({ row: row as FormGroup, index }))
      .filter(({ row }) => {
        const ourId = String(row.get('our_id')?.value || '');
        if (!ourId) {
          return !q;
        }
        if (!q) {
          return true;
        }
        const key = String(row.get('our_key')?.value || '').toLowerCase();
        return key.includes(q) || ourId.toLowerCase().includes(q);
      });
  }

  isDraftMappingRow(row: FormGroup): boolean {
    return !row.get('our_id')?.value;
  }

  onJiraDictPicked(key: DictMappingKey, row: FormGroup, jiraId: string): void {
    const id = jiraId || '';
    const opt = this.jiraOptionLists[key]?.find((i) => i.id === id);
    const label = opt?.label || '';
    const unmapped = this.transloco.translate('settings.jira-unmapped');
    const name =
      !id || label === unmapped
        ? ''
        : label.includes(' (')
          ? label.slice(0, label.lastIndexOf(' ('))
          : label;
    row.patchValue({ jira_id: id, jira_name: name });
    row.markAsDirty();
    this.cd.markForCheck();
  }

  onOurDictPicked(key: DictMappingKey, row: FormGroup, ourId: string): void {
    const id = ourId || '';
    const opt = this.ourOptionLists[key]?.find((i) => String(i.id) === id);
    row.patchValue({
      our_id: id,
      our_name: opt?.label || '',
    });
    row.markAsDirty();
    this.ourRowModels.clear();
    this.cd.markForCheck();
  }

  onJiraProjectPicked(row: FormGroup, jiraId: string): void {
    const id = jiraId || '';
    const opt = this.jiraOptionLists.project_mapping?.find((i) => i.id === id);
    const label = opt?.label || '';
    const unmapped = this.transloco.translate('settings.jira-unmapped');
    const key =
      !id || label === unmapped
        ? ''
        : label.includes(' (')
          ? label.slice(0, label.lastIndexOf(' ('))
          : label;
    row.patchValue({ jira_id: id, jira_key: key });
    row.markAsDirty();
    this.cd.markForCheck();
  }

  onOurProjectPicked(row: FormGroup, ourId: string): void {
    const id = ourId || '';
    const opt = this.ourOptionLists.project_mapping?.find(
      (i) => String(i.id) === id,
    );
    const label = opt?.label || '';
    const key = label.includes(' — ')
      ? label.slice(0, label.indexOf(' — '))
      : label;
    row.patchValue({ our_id: id, our_key: key });
    row.markAsDirty();
    this.ourRowModels.clear();
    this.cd.markForCheck();
  }

  private replaceTemplates(settings: JiraSettings): void {
    const arr = this.form.controls.templates;
    arr.clear();
    this.templateSelectModels.clear();
    let templates = settings.templates || [];
    if (!templates.length) {
      templates = [
        {
          id: 'default',
          name: 'Default',
          when: [],
          fields: settings.fields || [],
        },
      ];
    }
    for (const t of templates) {
      arr.push(this.createTemplateGroup(t));
    }
  }

  private createDictRow(row?: JiraDictMatch): FormGroup {
    const our = row?.our?.[0];
    const jira = row?.jira?.[0];
    return new FormGroup({
      our_id: new FormControl(our?.id || '', { nonNullable: true }),
      our_name: new FormControl(our?.name || '', { nonNullable: true }),
      jira_id: new FormControl(jira?.id || '', { nonNullable: true }),
      jira_name: new FormControl(jira?.name || '', { nonNullable: true }),
    });
  }

  private createProjectRow(row?: JiraProjMatch): FormGroup {
    const our = row?.our?.[0];
    const jira = row?.jira?.[0];
    return new FormGroup({
      our_id: new FormControl(our?.id || '', { nonNullable: true }),
      our_key: new FormControl(our?.key || '', { nonNullable: true }),
      jira_id: new FormControl(jira?.id || '', { nonNullable: true }),
      jira_key: new FormControl(jira?.key || '', { nonNullable: true }),
    });
  }

  private createTemplateGroup(t?: JiraSyncTemplate): FormGroup {
    const when = new FormArray<FormGroup>([]);
    for (const c of t?.when || []) {
      when.push(this.createWhenGroup(c));
    }
    const fields = new FormArray<FormGroup>([]);
    for (const f of t?.fields || []) {
      fields.push(this.createFieldGroup(f));
    }
    return new FormGroup({
      id: new FormControl(t?.id || this.newId(), { nonNullable: true }),
      name: new FormControl(t?.name || 'Template', { nonNullable: true }),
      when,
      fields,
    });
  }

  private createWhenGroup(c?: JiraFieldCondition): FormGroup {
    const value =
      typeof c?.value === 'string' || typeof c?.value === 'number'
        ? String(c.value)
        : Array.isArray(c?.value)
          ? (c?.value as unknown[]).join(', ')
          : c?.value != null
            ? JSON.stringify(c.value)
            : '';
    return new FormGroup({
      field: new FormControl(c?.field || '', { nonNullable: true }),
      op: new FormControl(c?.op || 'eq', { nonNullable: true }),
      value: new FormControl(value, { nonNullable: true }),
    });
  }

  private createFieldGroup(f?: JiraSyncField): FormGroup {
    return new FormGroup({
      source_field: new FormControl(f?.source_field || '', {
        nonNullable: true,
      }),
      source_label: new FormControl(f?.source_label || '', {
        nonNullable: true,
      }),
      source_script: new FormControl(f?.source_script || '', {
        nonNullable: true,
      }),
      target_field: new FormControl(f?.target_field || '', {
        nonNullable: true,
      }),
      target_label: new FormControl(f?.target_label || '', {
        nonNullable: true,
      }),
      target_script: new FormControl(f?.target_script || '', {
        nonNullable: true,
      }),
      direction: new FormControl(f?.direction || '<>', { nonNullable: true }),
    });
  }

  private newId(): string {
    return `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private serialize(): JiraSettings {
    const raw = this.form.getRawValue();
    const serializeDict = (
      rows: {
        our_id: string;
        our_name: string;
        jira_id: string;
        jira_name: string;
      }[],
    ): JiraDictMatch[] =>
      rows
        .filter((r) => !!r.our_id)
        .map((r) => ({
          our: [{ id: r.our_id, name: r.our_name }],
          jira: r.jira_id
            ? [{ id: r.jira_id, name: r.jira_name }]
            : [],
        }));

    const templates: JiraSyncTemplate[] = (
      raw.templates as {
        id: string;
        name: string;
        when: { field: string; op: string; value: string }[];
        fields: {
          source_field: string;
          source_label: string;
          source_script: string;
          target_field: string;
          target_label: string;
          target_script: string;
          direction: string;
        }[];
      }[]
    ).map((t) => ({
      id: t.id,
      name: t.name,
      when: (t.when || []).map((c) => {
        const op = c.op || 'eq';
        let value: unknown = c.value;
        if (op === 'in') {
          value = String(c.value || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return { field: c.field, op, value };
      }),
      fields: (t.fields || []).map((f) => ({
        source_field: f.source_field,
        source_label: f.source_label,
        source_script: f.source_script,
        target_field: f.target_field,
        target_label: f.target_label,
        target_script: f.target_script,
        direction: f.direction,
      })),
    }));

    return {
      rest_api_url: raw.rest_api_url,
      public_url: raw.public_url,
      hook_address: raw.hook_address,
      jql: raw.jql,
      oql: raw.oql,
      push_mode: raw.push_mode,
      import_auto_enabled: !!raw.import_auto_enabled,
      import_auto_interval_minutes:
        Number(raw.import_auto_interval_minutes) || 60,
      epic_our_type_ids: (raw.epic_our_type_ids as string[]).filter(Boolean),
      status_mapping: serializeDict(
        raw.status_mapping as {
          our_id: string;
          our_name: string;
          jira_id: string;
          jira_name: string;
        }[],
      ),
      priority_mapping: serializeDict(
        raw.priority_mapping as {
          our_id: string;
          our_name: string;
          jira_id: string;
          jira_name: string;
        }[],
      ),
      type_mapping: serializeDict(
        raw.type_mapping as {
          our_id: string;
          our_name: string;
          jira_id: string;
          jira_name: string;
        }[],
      ),
      project_mapping: (
        raw.project_mapping as {
          our_id: string;
          our_key: string;
          jira_id: string;
          jira_key: string;
        }[]
      )
        .filter((r) => !!r.our_id)
        .map((r) => ({
          our: [{ id: r.our_id, key: r.our_key }],
          jira: r.jira_id ? [{ id: r.jira_id, key: r.jira_key }] : [],
        })),
      jira_catalog: this.jiraCatalog,
      templates,
      // Keep legacy flat fields as the default template fields for older readers.
      fields: templates.find((t) => !t.when?.length)?.fields || templates[0]?.fields || [],
    };
  }

  private async callApi<T>(source: Observable<T>): Promise<T | null> {
    return firstValueFrom(source.pipe(defaultIfEmpty(null)));
  }

  async save(): Promise<void> {
    this.busy.set(true);
    try {
      const saved = await this.callApi(
        this.dataService.jiraSaveSettings(this.serialize()),
      );
      if (!saved) {
        return;
      }
      this.applySettings(saved);
      this.toastService.success(
        this.transloco.translate('settings.jira-saved'),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async exportConfig(): Promise<void> {
    this.busy.set(true);
    try {
      const bundle = await this.callApi(this.dataService.jiraExportConfig());
      if (!bundle) {
        return;
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renwu-jira-config.json';
      a.click();
      URL.revokeObjectURL(url);
      this.toastService.success(
        this.transloco.translate('settings.jira-export-done'),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
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
      this.alertService.confirm(
        this.transloco.translate('settings.jira-import-title'),
        this.transloco.translate('settings.jira-import-text'),
        true,
        this.transloco.translate('settings.jira-import'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!confirmed?.affirmative) {
      return;
    }
    this.busy.set(true);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as JiraConfigBundle;
      const imported = await this.callApi(
        this.dataService.jiraImportConfig(bundle),
      );
      if (!imported?.settings) {
        this.toastService.error(
          this.transloco.translate('settings.jira-import-failed'),
        );
        return;
      }
      this.applySettings(imported.settings);
      this.toastService.success(
        this.transloco.translate('settings.jira-import-done'),
      );
    } catch {
      this.toastService.error(
        this.transloco.translate('settings.jira-import-failed'),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  /** Persist current form so JQL/OQL actions use the latest filters. */
  private async saveQuiet(): Promise<boolean> {
    const saved = await this.callApi(
      this.dataService.jiraSaveSettings(this.serialize()),
    );
    if (!saved) {
      return false;
    }
    this.applySettings(saved);
    return true;
  }

  async checkJql(): Promise<void> {
    this.busy.set(true);
    try {
      if (!(await this.saveQuiet())) {
        return;
      }
      const res = await this.callApi(this.dataService.jiraCheckJQL());
      if (!res) {
        return;
      }
      this.toastService.info(
        this.transloco.translate('settings.jira-check-jql-result', {
          total: res.total ?? 0,
        }),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async importJql(): Promise<void> {
    this.busy.set(true);
    try {
      if (!(await this.saveQuiet())) {
        return;
      }
      const res = await this.callApi(this.dataService.jiraImportJQL());
      if (!res) {
        return;
      }
      this.toastService.success(
        this.transloco.translate('settings.jira-import-jql-started', {
          total: res.total ?? 0,
        }),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async checkOql(): Promise<void> {
    this.busy.set(true);
    try {
      if (!(await this.saveQuiet())) {
        return;
      }
      const res = await this.callApi(this.dataService.jiraCheckOQL());
      if (!res) {
        return;
      }
      this.toastService.info(
        this.transloco.translate('settings.jira-check-oql-result', {
          total: res.total ?? 0,
        }),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async exportOql(createIfMissing: boolean): Promise<void> {
    this.busy.set(true);
    try {
      if (!(await this.saveQuiet())) {
        return;
      }
      const res = await this.callApi(
        this.dataService.jiraExportOQL(createIfMissing),
      );
      if (!res) {
        return;
      }
      this.toastService.success(
        this.transloco.translate(
          createIfMissing
            ? 'settings.jira-export-oql-create-started'
            : 'settings.jira-export-oql-started',
          { total: res.total ?? 0 },
        ),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  async updateDictionaries(): Promise<void> {
    this.busy.set(true);
    try {
      const saved = await this.callApi(
        this.dataService.jiraSaveSettings(this.serialize()),
      );
      if (!saved) {
        return;
      }
      const settings = await this.callApi(
        this.dataService.jiraUpdateDictionaries(),
      );
      if (!settings) {
        return;
      }
      this.applySettings(settings);
      this.toastService.success(
        this.transloco.translate('settings.jira-dictionaries-updated'),
      );
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  addDictRow(key: DictMappingKey): void {
    this.setMappingFilter(key, '');
    this.mappingArray(key).push(this.createDictRow());
    void this.loadOurCatalogs();
    this.cd.markForCheck();
  }

  removeDictRow(key: DictMappingKey, index: number): void {
    this.mappingArray(key).removeAt(index);
    this.ourRowModels.clear();
    this.cd.markForCheck();
  }

  addProjectRow(): void {
    this.setMappingFilter('project_mapping', '');
    this.form.controls.project_mapping.push(this.createProjectRow());
    void this.loadOurCatalogs();
    this.cd.markForCheck();
  }

  removeProjectRow(index: number): void {
    this.form.controls.project_mapping.removeAt(index);
    this.ourRowModels.clear();
    this.cd.markForCheck();
  }

  addTemplate(): void {
    this.templates.push(
      this.createTemplateGroup({
        id: this.newId(),
        name: this.transloco.translate('settings.jira-new-template'),
        when: [],
        fields: [],
      }),
    );
    this.selectedTemplateIndex.set(this.templates.length - 1);
  }

  removeTemplate(index: number): void {
    if (this.templates.length <= 1) {
      return;
    }
    this.templates.removeAt(index);
    this.selectedTemplateIndex.set(
      Math.min(index, this.templates.length - 1),
    );
  }

  selectTemplate(index: number): void {
    this.selectedTemplateIndex.set(index);
  }

  addWhen(): void {
    this.selectedTemplateWhen()?.push(this.createWhenGroup());
  }

  removeWhen(index: number): void {
    this.selectedTemplateWhen()?.removeAt(index);
  }

  addField(): void {
    this.selectedTemplateFields()?.push(
      this.createFieldGroup({ direction: '<>' }),
    );
  }

  /** Preset: Jira Story Points ↔ Renwu estimated_time (1 SP = 8h). */
  addStoryPointsField(): void {
    this.selectedTemplateFields()?.push(
      this.createFieldGroup({
        source_field: 'customfield_10052',
        source_label: 'Story Points',
        target_field: 'estimated_time',
        target_label: 'Estimate',
        direction: '<>',
        source_script:
          'if (IN == null || IN === "" || +IN <= 0) { SKIP = true; } else { OUT = STORY_POINTS_TO_ESTIMATE(IN); }',
        target_script:
          'if (IN == null || +IN <= 0) { SKIP = true; } else { OUT = ESTIMATE_TO_STORY_POINTS(IN); }',
      }),
    );
  }

  /** Preset: Jira issue key → Renwu primary key (old key stays in keys[]). */
  addIssueKeyField(): void {
    this.selectedTemplateFields()?.push(
      this.createFieldGroup({
        source_field: 'key',
        source_label: 'Jira Key',
        target_field: 'key',
        target_label: 'Key',
        direction: '>',
        source_script: 'OUT = JIRA_ISSUE_KEY(); if (!OUT) { SKIP = true; }',
      }),
    );
  }

  /** Preset: parent Renwu Epic → Jira Epic Link (export only). */
  addEpicLinkField(): void {
    this.selectedTemplateFields()?.push(
      this.createFieldGroup({
        source_field: 'customfield_15500',
        source_label: 'Epic Link',
        target_field: 'id',
        target_label: 'Parent Epic',
        direction: '<',
        target_script:
          'var k = PARENT_EPIC_JIRA_KEY(); if (!k) { SKIP = true; } else { OUT = k; }',
      }),
    );
  }

  removeField(index: number): void {
    this.selectedTemplateFields()?.removeAt(index);
  }

  private replaceEpicOurTypeIds(ids: string[] | undefined): void {
    const arr = this.epicOurTypeIds;
    while (arr.length) {
      arr.removeAt(0);
    }
    for (const id of ids || []) {
      if (id) {
        arr.push(new FormControl(id, { nonNullable: true }));
      }
    }
  }

  epicTypeLabel(id: string): string {
    const found = (this.ourOptionLists.type_mapping || []).find(
      (o) => String(o.id) === String(id),
    );
    return found?.label || id;
  }

  private refreshEpicTypeAddModel(): void {
    const used = new Set(this.epicOurTypeIds.controls.map((c) => c.value));
    this.epicTypeAddModel.staticData = (
      this.ourOptionLists.type_mapping || []
    )
      .filter((o) => !used.has(String(o.id)))
      .map((o) => ({ id: String(o.id), label: o.label || String(o.id) }));
  }

  addEpicType(id: string): void {
    const value = String(id || '').trim();
    this.epicTypeAddId = '';
    if (!value) {
      return;
    }
    if (this.epicOurTypeIds.controls.some((c) => c.value === value)) {
      return;
    }
    this.epicOurTypeIds.push(new FormControl(value, { nonNullable: true }));
    this.refreshEpicTypeAddModel();
    this.form.markAsDirty();
    this.cd.markForCheck();
  }

  removeEpicType(index: number): void {
    this.epicOurTypeIds.removeAt(index);
    this.refreshEpicTypeAddModel();
    this.form.markAsDirty();
  }

  async showDiff(): Promise<void> {
    this.busy.set(true);
    try {
      if (!(await this.saveQuiet())) {
        return;
      }
      const oql = this.form.controls.oql.value?.trim();
      const result = await this.callApi(
        this.dataService.jiraPreviewDiff(oql ? { oql } : {}),
      );
      if (result === null) {
        return;
      }
      const list = Array.isArray(result) ? result : [];
      this.diffs.set(list);
      this.selectedDiffIds.set(new Set());
      if (!list.length) {
        this.toastService.info(
          this.transloco.translate('settings.jira-diff-empty'),
        );
      }
    } finally {
      this.busy.set(false);
      this.cd.markForCheck();
    }
  }

  diffRowKey(diff: JiraIssueDiff): string {
    if (diff.issue_id) {
      return diff.issue_id;
    }
    if (diff.jira_key) {
      return `jira:${diff.jira_key}`;
    }
    return '';
  }

  jiraBrowseUrl(jiraKey: string | undefined): string | null {
    const key = (jiraKey || '').trim();
    if (!key || key.includes('://')) {
      // Already a URL in external_links, or empty.
      if (key.includes('://')) {
        return key;
      }
      return null;
    }
    const base = (this.form.controls.public_url.value || '')
      .trim()
      .replace(/\/+$/, '');
    if (!base) {
      return null;
    }
    return `${base}/browse/${key}`;
  }

  canSelectDiff(diff: JiraIssueDiff): boolean {
    return !diff.error && (!!diff.issue_id || !!diff.jira_key);
  }

  toggleDiff(rowKey: string, checked: boolean): void {
    if (!rowKey) {
      return;
    }
    const next = new Set(this.selectedDiffIds());
    if (checked) {
      next.add(rowKey);
    } else {
      next.delete(rowKey);
    }
    this.selectedDiffIds.set(next);
  }

  isDiffSelected(rowKey: string): boolean {
    return !!rowKey && this.selectedDiffIds().has(rowKey);
  }

  toggleAllDiffs(checked: boolean): void {
    if (!checked) {
      this.selectedDiffIds.set(new Set());
      return;
    }
    this.selectedDiffIds.set(
      new Set(
        this.diffs()
          .filter((d) => this.canSelectDiff(d))
          .map((d) => this.diffRowKey(d))
          .filter(Boolean),
      ),
    );
  }

  allSelectableDiffsChecked(): boolean {
    const keys = this.diffs()
      .filter((d) => this.canSelectDiff(d))
      .map((d) => this.diffRowKey(d))
      .filter(Boolean);
    if (!keys.length) {
      return false;
    }
    const selected = this.selectedDiffIds();
    return keys.every((k) => selected.has(k));
  }

  changedFields(diff: JiraIssueDiff): string {
    if (diff.error) {
      return diff.error;
    }
    return (diff.fields || [])
      .filter((f) => f.changed)
      .map((f) => f.field)
      .filter(Boolean)
      .join(', ');
  }

  private selectedRows(): JiraIssueDiff[] {
    const keys = this.selectedDiffIds();
    return this.diffs().filter((d) => keys.has(this.diffRowKey(d)));
  }

  async pullSelected(): Promise<void> {
    const rows = this.selectedRows();
    const issue_ids = rows
      .filter((d) => d.mapped && d.issue_id)
      .map((d) => d.issue_id as string);
    const jira_keys = rows
      .filter((d) => d.would_import && d.jira_key)
      .map((d) => d.jira_key as string);
    if (!issue_ids.length && !jira_keys.length) {
      return;
    }
    this.busy.set(true);
    try {
      const ok = await this.callApi(
        this.dataService.jiraSyncBatch({
          issue_ids,
          jira_keys,
          direction: 'import',
        }),
      );
      if (ok == null) {
        return;
      }
      this.toastService.success(
        this.transloco.translate('settings.jira-pull-done'),
      );
      await this.showDiff();
    } finally {
      this.busy.set(false);
    }
  }

  async pushSelected(): Promise<void> {
    const issue_ids = this.selectedRows()
      .filter((d) => d.mapped && d.issue_id)
      .map((d) => d.issue_id as string);
    if (!issue_ids.length) {
      return;
    }
    this.busy.set(true);
    try {
      const ok = await this.callApi(
        this.dataService.jiraSyncBatch({ issue_ids, direction: 'export' }),
      );
      if (ok == null) {
        return;
      }
      this.toastService.success(
        this.transloco.translate('settings.jira-push-done'),
      );
      await this.showDiff();
    } finally {
      this.busy.set(false);
    }
  }

  async createSelectedInJira(): Promise<void> {
    const issue_ids = this.selectedRows()
      .filter((d) => d.issue_id && !d.mapped && !d.would_import)
      .map((d) => d.issue_id as string);
    if (!issue_ids.length) {
      return;
    }
    const confirm = await firstValueFrom(
      this.alertService.confirm(
        this.transloco.translate('settings.jira-create-confirm-title'),
        this.transloco.translate('settings.jira-create-confirm-text', {
          count: issue_ids.length,
        }),
        true,
        this.transloco.translate('settings.create'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!confirm?.affirmative) {
      return;
    }
    this.busy.set(true);
    try {
      const ok = await this.callApi(
        this.dataService.jiraSyncBatch({
          issue_ids,
          direction: 'export',
          create_if_missing: true,
        }),
      );
      if (ok == null) {
        return;
      }
      this.toastService.success(
        this.transloco.translate('settings.jira-create-done'),
      );
      await this.showDiff();
    } finally {
      this.busy.set(false);
    }
  }
}
