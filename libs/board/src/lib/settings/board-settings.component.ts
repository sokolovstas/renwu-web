import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ISelectItem,
  RwAlertService,
  RwButtonComponent,
  RwCheckboxComponent,
  RwSelectComponent,
  RwTextInputComponent,
  SelectModelBase,
} from '@renwu/components';
import { QueryBuilderComponent, RwUserService, Status } from '@renwu/core';
import {
  BoardGroupConfig,
  BoardGroupsConfig,
  BoardSettings,
  BoardStatusColumnConfig,
} from '../board.model';
import { RwBoardService } from '../board.service';
import { RwGroupService } from '../group/group.service';

@Component({
  selector: 'renwu-board-settings',
  standalone: true,
  imports: [
    FormsModule,
    RwTextInputComponent,
    RwCheckboxComponent,
    RwButtonComponent,
    RwSelectComponent,
    QueryBuilderComponent,
    TranslocoPipe,
  ],
  templateUrl: './board-settings.component.html',
  styleUrl: './board-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSettingsComponent {
  private userService = inject(RwUserService);
  private alertService = inject(RwAlertService);
  private boardService = inject(RwBoardService);
  private groupService = inject(RwGroupService);
  private cd = inject(ChangeDetectorRef);
  private transloco = inject(TranslocoService);

  @Output()
  readonly reloadBoards = new EventEmitter<void>();

  @Output()
  readonly updateGrouping = new EventEmitter<BoardGroupsConfig>();

  @Input()
  set groupsConfig(value: BoardGroupsConfig) {
    if (!value) {
      return;
    }
    this._groupsConfig = value.clone();
    this._originalGroupsConfig = value.clone();
    this.viewOnly =
      this._groupsConfig.authorId !== this.userService.getId() &&
      !this.userService.getIsAdmin();
    this.rebuildGroupSelectModels();
    this.cd.markForCheck();
  }

  get groupsConfig(): BoardGroupsConfig {
    return this._groupsConfig;
  }

  _groupsConfig: BoardGroupsConfig;
  _originalGroupsConfig: BoardGroupsConfig;

  viewOnly: boolean;
  haveChanges: boolean;

  readonly groupFields = BoardSettings.groupFields;
  readonly groupViews = BoardSettings.groupViews;
  readonly issueViews = BoardSettings.issueViews;
  readonly cardType = BoardSettings.cardType;

  /** Per-row select models; indices match `groupsConfig.groups`. */
  groupFieldModels: SelectModelBase<string>[] = [];
  groupViewModels: SelectModelBase<string>[] = [];
  groupFixedModels: SelectModelBase<string>[] = [];
  groupStatusColumnStatusModels: SelectModelBase<string>[][] = [];
  groupStatusColumnTargetModels: SelectModelBase<string>[][] = [];

  addGroup(): void {
    const newGroup = new BoardGroupConfig();
    newGroup.field = BoardSettings.groupFields[0];
    newGroup.view = BoardSettings.groupViews[0];
    newGroup.fixed = [];
    this.groupsConfig.groups.push(newGroup);
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  removeGroup(group: BoardGroupConfig): void {
    const idx = this.groupsConfig.groups.indexOf(group);
    if (idx > -1) {
      this.groupsConfig.groups.splice(idx, 1);
    }
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  changeGroupsConfig(config: BoardGroupsConfig): void {
    this._groupsConfig = config;
    this.updateGroupingNext();
  }

  updateGroupingNext(): void {
    this.haveChanges = true;
    this.updateGrouping.emit(this.groupsConfig);
    this.cd.markForCheck();
  }

  discard(): void {
    this._groupsConfig = this._originalGroupsConfig.clone();
    this.haveChanges = false;
    this.rebuildGroupSelectModels();
    this.updateGrouping.emit(this.groupsConfig);
    this.cd.markForCheck();
  }

  delete(): void {
    this.alertService
      .confirm(
        this.transloco.translate('boards.settings.deleteConfirmTitle', {
          title: this.groupsConfig.title,
        }),
        this.transloco.translate('boards.settings.deleteConfirmText'),
        true,
      )
      .subscribe((data: { affirmative?: boolean }) => {
        if (data?.affirmative) {
          this.boardService.deleteBoard(this.groupsConfig.id).subscribe(() => {
            this.reloadBoards.emit();
          });
        }
      });
  }

  save(): void {
    this.boardService.saveBoard(this.groupsConfig).subscribe((server) => {
      this._originalGroupsConfig = BoardGroupsConfig.fromServer(server);
      this._groupsConfig = this._originalGroupsConfig.clone();
      this.haveChanges = false;
      this.rebuildGroupSelectModels();
      this.updateGrouping.emit(this.groupsConfig);
      this.reloadBoards.emit();
      this.cd.markForCheck();
    });
  }

  onGroupFieldChanged(
    group: BoardGroupConfig,
    items: ISelectItem<unknown>[],
  ): void {
    const id = items?.[0]?.id as string;
    const field = BoardSettings.groupFields.find((f) => f.id === id);
    if (field) {
      group.field = field;
      group.fixed = [];
      if (field.id === 'status-buckets' && group.statusColumns.length === 0) {
        group.statusColumns = this.createDefaultStatusColumns();
      }
    }
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  onGroupViewChanged(
    group: BoardGroupConfig,
    items: ISelectItem<unknown>[],
  ): void {
    const id = items?.[0]?.id as string;
    const view = BoardSettings.groupViews.find((v) => v.id === id);
    if (view) {
      group.view = view;
    }
    this.updateGroupingNext();
  }

  onGroupFixedChanged(
    group: BoardGroupConfig,
    items: ISelectItem<unknown>[],
  ): void {
    group.fixed = (items || []).map((i) => String(i.id));
    this.updateGroupingNext();
  }

  onStatusColumnTitleChanged(): void {
    this.updateGroupingNext();
  }

  onStatusColumnQueryChanged(
    column: BoardStatusColumnConfig,
    query: string,
  ): void {
    column.query = query;
    this.rebuildStatusColumnStatusModels();
    this.updateGroupingNext();
  }

  onStatusColumnStatusesChanged(
    column: BoardStatusColumnConfig,
    items: ISelectItem<unknown>[],
  ): void {
    const statuses = (items || []).map((item) => String(item.id));
    column.query = this.replaceStatusQuery(column.query, statuses);
    if (statuses.length && !statuses.includes(column.targetStatus)) {
      column.targetStatus = statuses[0];
      this.rebuildGroupSelectModels();
    }
    this.updateGroupingNext();
  }

  onStatusColumnTargetChanged(
    column: BoardStatusColumnConfig,
    items: ISelectItem<unknown>[],
  ): void {
    column.targetStatus = String(items?.[0]?.id ?? '');
    this.updateGroupingNext();
  }

  addStatusColumn(group: BoardGroupConfig): void {
    const column = new BoardStatusColumnConfig('New column');
    const firstStatus = String(this.statusOptions()[0]?.id ?? '');
    column.query = firstStatus ? `status = ${firstStatus}` : '';
    column.targetStatus = firstStatus;
    group.statusColumns.push(column);
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  removeStatusColumn(group: BoardGroupConfig, column: BoardStatusColumnConfig): void {
    group.statusColumns = group.statusColumns.filter((c) => c !== column);
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  duplicateStatusColumn(
    group: BoardGroupConfig,
    column: BoardStatusColumnConfig,
  ): void {
    const clone = new BoardStatusColumnConfig(
      `${column.title} ${this.transloco.translate('boards.settings.copySuffix')}`,
    );
    clone.query = column.query;
    clone.targetStatus = column.targetStatus;
    clone.collapsed = column.collapsed;
    clone.wipLimit = column.wipLimit;
    const index = group.statusColumns.indexOf(column);
    group.statusColumns.splice(index + 1, 0, clone);
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  moveStatusColumn(
    group: BoardGroupConfig,
    column: BoardStatusColumnConfig,
    direction: -1 | 1,
  ): void {
    const index = group.statusColumns.indexOf(column);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= group.statusColumns.length) {
      return;
    }
    group.statusColumns.splice(index, 1);
    group.statusColumns.splice(nextIndex, 0, column);
    this.rebuildGroupSelectModels();
    this.updateGroupingNext();
  }

  getStatusColumnTargetModel(
    groupIndex: number,
    columnIndex: number,
    column: BoardStatusColumnConfig,
  ): SelectModelBase<string> {
    this.groupStatusColumnTargetModels[groupIndex] =
      this.groupStatusColumnTargetModels[groupIndex] || [];
    return (this.groupStatusColumnTargetModels[groupIndex][columnIndex] =
      this.groupStatusColumnTargetModels[groupIndex][columnIndex] ||
      this.createStatusTargetModel(column));
  }

  getStatusColumnStatusModel(
    groupIndex: number,
    columnIndex: number,
    column: BoardStatusColumnConfig,
  ): SelectModelBase<string> {
    this.groupStatusColumnStatusModels[groupIndex] =
      this.groupStatusColumnStatusModels[groupIndex] || [];
    return (this.groupStatusColumnStatusModels[groupIndex][columnIndex] =
      this.groupStatusColumnStatusModels[groupIndex][columnIndex] ||
      this.createStatusQueryModel(column));
  }

  onBoardViewChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const view = BoardSettings.issueViews.find((v) => v.id === id);
    if (view) {
      this.groupsConfig.view = view;
    }
    this.updateGroupingNext();
  }

  onBoardTypeChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const type = BoardSettings.cardType.find((t) => t.id === id);
    if (type) {
      this.groupsConfig.type = type;
    }
    this.updateGroupingNext();
  }

  boardViewModel = this.createSingleModel(
    BoardSettings.issueViews.map((v) => ({ id: v.id, label: v.label })),
  );
  boardTypeModel = this.createSingleModel(
    BoardSettings.cardType.map((t) => ({ id: t.id, label: t.label })),
  );
  boardDensityModel = this.createSingleModel(
    BoardSettings.cardDensity.map((d) => ({ id: d.id, label: d.label })),
  );
  boardColorModeModel = this.createSingleModel(
    BoardSettings.colorModes.map((m) => ({ id: m.id, label: m.label })),
  );

  onBoardDensityChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const density = BoardSettings.cardDensity.find((d) => d.id === id);
    if (density) {
      this.groupsConfig.density = density;
    }
    this.updateGroupingNext();
  }

  onBoardColorModeChanged(items: ISelectItem<unknown>[]): void {
    const id = items?.[0]?.id as string;
    const mode = BoardSettings.colorModes.find((m) => m.id === id);
    if (mode) {
      this.groupsConfig.colorMode = mode;
    }
    this.updateGroupingNext();
  }

  private rebuildGroupSelectModels(): void {
    if (!this._groupsConfig?.groups) {
      this.groupFieldModels = [];
      this.groupViewModels = [];
      this.groupFixedModels = [];
      this.groupStatusColumnStatusModels = [];
      this.groupStatusColumnTargetModels = [];
      return;
    }
    this.groupFieldModels = this._groupsConfig.groups.map((g) =>
      this.createSingleModel(
        BoardSettings.groupFields.map((f) => ({ id: f.id, label: f.label })),
        g.field?.id,
      ),
    );
    this.groupViewModels = this._groupsConfig.groups.map((g) =>
      this.createSingleModel(
        BoardSettings.groupViews.map((v) => ({ id: v.id, label: v.label })),
        g.view?.id,
      ),
    );
    this.groupFixedModels = this._groupsConfig.groups.map((g) =>
      this.createFixedModel(g),
    );
    this.rebuildStatusColumnStatusModels();
    this.rebuildStatusColumnTargetModels();
    void this.boardViewModel.setData(this.groupsConfig.view?.id);
    void this.boardTypeModel.setData(this.groupsConfig.type?.id);
    void this.boardDensityModel.setData(this.groupsConfig.density?.id);
    void this.boardColorModeModel.setData(this.groupsConfig.colorMode?.id);
    this.cd.markForCheck();
  }

  private rebuildStatusColumnStatusModels(): void {
    this.groupStatusColumnStatusModels = (this._groupsConfig?.groups || []).map((g) =>
      (g.statusColumns || []).map((column) =>
        this.createStatusQueryModel(column),
      ),
    );
  }

  private rebuildStatusColumnTargetModels(): void {
    this.groupStatusColumnTargetModels = (this._groupsConfig?.groups || []).map((g) =>
      (g.statusColumns || []).map((column) =>
        this.createStatusTargetModel(column),
      ),
    );
  }

  private createSingleModel(
    staticData: ISelectItem<string>[],
    selectedId?: string,
  ): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.loadSelected = true;
    model.staticData = staticData;
    const sid = selectedId ?? staticData[0]?.id;
    void model.setData(sid != null ? String(sid) : undefined);
    return model;
  }

  private createFixedModel(group: BoardGroupConfig): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.many = true;
    model.loadSelected = true;
    const dictKey = group.field?.dict;
    const dict = dictKey ? this.groupService.dictionaries?.get(dictKey) : null;
    const raw = (dict ?? []) as unknown[];
    model.staticData = raw.map((entry) => {
      if (typeof entry === 'string') {
        return {
          id: entry,
          label: entry,
        };
      }
      const e = entry as { id?: string; title?: string; label?: string };
      return {
        id: e.id ?? e.title ?? e.label,
        label: e.title || e.label || String(e.id),
      };
    }) as ISelectItem<string>[];
    void model.setData(group.fixed?.length ? [...group.fixed] : []);
    return model;
  }

  private createStatusTargetModel(
    column: BoardStatusColumnConfig,
  ): SelectModelBase<string> {
    return this.createSingleModel(
      this.statusOptions(),
      column.targetStatus,
    );
  }

  private createStatusQueryModel(
    column: BoardStatusColumnConfig,
  ): SelectModelBase<string> {
    const model = new SelectModelBase<string>();
    model.many = true;
    model.loadSelected = true;
    model.staticData = this.statusOptions();
    void model.setData(this.extractStatusQueryValues(column.query));
    return model;
  }

  private createDefaultStatusColumns(): BoardStatusColumnConfig[] {
    return this.statusOptions().map((status) => {
      const column = new BoardStatusColumnConfig(status.label);
      column.id = `status-column-${status.id}`;
      column.query = `status = ${status.id}`;
      column.targetStatus = String(status.id);
      return column;
    });
  }

  private statusOptions(): ISelectItem<string>[] {
    const statuses = (this.groupService.dictionaries?.get('statuses') ??
      []) as Status[];
    return statuses.map((status) => ({
      id: status.id,
      label: status.label,
    }));
  }

  private replaceStatusQuery(query: string, statuses: string[]): string {
    const statusQuery = statuses.length
      ? `status = ${statuses.map((status) => this.quoteQueryValue(status)).join(',')}`
      : '';
    const existing = query || '';
    const statusAtom = /\bstatus\s*=\s*(?:"[^"]*"|'[^']*'|[^\s()]+)(?:\s*,\s*(?:"[^"]*"|'[^']*'|[^\s()]+))*/i;
    if (statusAtom.test(existing)) {
      return this.cleanQuery(existing.replace(statusAtom, statusQuery));
    }
    return this.cleanQuery([statusQuery, existing].filter(Boolean).join(' and '));
  }

  private extractStatusQueryValues(query: string): string[] {
    const match = (query || '').match(
      /\bstatus\s*=\s*((?:"[^"]*"|'[^']*'|[^\s()]+)(?:\s*,\s*(?:"[^"]*"|'[^']*'|[^\s()]+))*)/i,
    );
    if (!match) {
      return [];
    }
    return match[1]
      .split(',')
      .map((value) => value.trim().replace(/^(['"])(.*)\1$/, '$2'))
      .filter(Boolean);
  }

  private quoteQueryValue(value: string): string {
    return /\s/.test(value) ? `"${value}"` : value;
  }

  private cleanQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/^\s*(and|or|nor)\s+/i, '')
      .replace(/\s+(and|or|nor)\s*$/i, '')
      .replace(/\s+(and|or|nor)\s+(and|or|nor)\s+/gi, ' and ')
      .trim();
  }
}
